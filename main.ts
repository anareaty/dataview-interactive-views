import { App, Modal, FuzzySuggestModal, Plugin, PluginSettingTab, setTooltip, Setting, SuggestModal, setIcon, getIcon, FuzzyMatch, TFile} from 'obsidian';
import * as Dataview from "obsidian-dataview"

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}




class MySuggestModal extends SuggestModal<string> {
	plugin: MyPlugin
	resolve: any
	reject:any
	values: string[] 
	names?: string[]
	constructor(app: App, plugin: MyPlugin, resolve: any, reject:any, values: string[], names?: string[]) {
	  super(app);
	  this.plugin = plugin;
	  this.resolve = resolve
	  this.reject = reject
	  this.values = values
	  this.names = names 
	}
	getSuggestions(query: string): string[] {
		return this.values.filter((val) => {
			if (val.startsWith("[[")) {
				val = val.replace(/(.*)(\/)([^\/]+)(\]\])(.*)/, "$3$5").replace(/(\[\[)(.*)(\]\])(.*)/, "$2$4")
			}
			return val.toLowerCase().includes(query.toLowerCase())
		});
	}
	renderSuggestion(val: string, el: Element) {
		let text = val
		if (this.names) {
			text = this.names[this.values.indexOf(val)]
		} 
		if (text.startsWith("[[")) {
			text = text.replace(/(.*)(\/)([^\/]+)(\]\])(.*)/, "$3$5")
				.replace(/(\[\[)(.*)(\]\])(.*)/, "$2$4")
				.replace(/(.*\|)(.*)/, "$2")
			let iconWrapper = el.createEl("span", { cls: "inline-icon" })
			let textEl = el.createEl("span", {text: text})
			setIcon(iconWrapper, "link")
		} else {
			el.createEl("div", {text: text})
		}	
	}
	onChooseSuggestion(val: string) {
		this.resolve(val)
	} 
}





class MyFuzzySuggestModal extends FuzzySuggestModal<string> {
	plugin: MyPlugin
	resolve: any
	reject:any
	values: string[] 
	names?: string[]
	constructor(app: App, plugin: MyPlugin, resolve: any, reject:any, values: string[], names?: string[]) {
	  super(app);
	  this.plugin = plugin;
	  this.resolve = resolve
	  this.reject = reject
	  this.values = values
	  this.names = names 
	}
	getItems() {
		return this.values
	}
	getItemText(val: string) {
		let text = val
		if (this.names) {
			text = this.names[this.values.indexOf(val)]
		}
		if (text.startsWith("[[")) {
			text = text.replace(/(.*)(\/)([^\/]+)(\]\])(.*)/, "$3$5")
			.replace(/(\[\[)(.*)(\]\])(.*)/, "$2$4")	
		}
		return text
	}
	renderSuggestion(val: FuzzyMatch<string>, el: Element) {
		let text = val.item
		if (this.names) {
			text = this.names[this.values.indexOf(text)]
		}
		if (text.startsWith("[[")) {
			text = text.replace(/(.*)(\/)([^\/]+)(\]\])(.*)/, "$3$5")
			.replace(/(\[\[)(.*)(\]\])(.*)/, "$2$4")
			.replace(/(.*\|)(.*)/, "$2")
			let iconWrapper = el.createEl("span", { cls: "inline-icon" })
			let textEl = el.createEl("span", {text: text})
			setIcon(iconWrapper, "link")
		} else {
			el.createEl("div", {text: text})
		} 
	}
	onChooseItem(val: string) {
		this.resolve(val)
	}   
}





class MyMultiSuggestModal extends Modal {
	resolve: any
	reject:any
	values: string[] 
	names: string[]
	header: string
	existingValues: MultiFilter
	result: MultiFilter
	constructor(app: App, header: string, values: string[], names: string[], existingValues: MultiFilter, resolve: any, reject:any) {
	  super(app);
	  this.resolve = resolve
	  this.reject = reject
	  this.values = values
	  this.names = names
	  this.header = header 
	  this.existingValues = existingValues
	}
	onOpen() {
		const {contentEl} = this
		contentEl.createEl("h1", {text: this.header})
		let include = this.existingValues.include
		if (!include) include = []
		let exclude = this.existingValues.exclude
		if (!exclude) exclude = []
		let allValues = this.existingValues.allValues
		if (!allValues) allValues = false
		this.result = {include, exclude, allValues}
		new Setting(contentEl)
		.setName("Result fits all values")
		.addToggle((toggle) => {
			toggle.setValue(this.result.allValues)
			toggle.onChange((toggleValue) => {
				this.result.allValues = toggleValue
			})
		})
		new Setting(contentEl).addButton((btn) => btn
		.setButtonText("Clear all")
		.onClick(() => {
			let toggles = document.querySelectorAll(".select-line .filter-checkbox.is-enabled") as NodeListOf<HTMLInputElement>
			for (let toggle of toggles) {
				toggle.click()
			}
		}))
		for (let val of this.values) {
			let index = this.values.indexOf(val)
			let lineClass = "select-line-" + index
			let name = this.names[index]
			new Setting(contentEl)
			.setName(name)
			.setClass(lineClass)
			.setClass("select-line")
			.addToggle((toggle) => {
				if (this.existingValues.include.find(a => a == val)) {
					toggle.setValue(true)
				}
				toggle.onChange((toggleValue) => {
					include = include.filter(a => a != val)
					if (toggleValue) {
						include.push(val)
					}
					this.result.include = include
					let excludeOn: HTMLInputElement | null = document.querySelector("." + lineClass + " .filter-checkbox:nth-child(2).is-enabled")
					if (toggleValue && excludeOn) {
						excludeOn.click()
					}     
				})
			})
			.addToggle((toggle) => {	
				if (this.existingValues.exclude.find(a => a == val)) {
					toggle.setValue(true)
				}
				toggle.onChange((toggleValue) => {
					exclude = exclude.filter(a => a != val)
					if (toggleValue) {
						exclude.push(val)
					}
					this.result.exclude = exclude
					let includeOn: HTMLInputElement | null = document.querySelector("." + lineClass + " .filter-checkbox:nth-child(1).is-enabled")
					if (toggleValue && includeOn) {
						includeOn.click()
					}
				})
			})
			let includeCheckbox = document.querySelector("." + lineClass + " .checkbox-container:nth-child(1)")
			includeCheckbox!.classList.add("include")
			includeCheckbox!.classList.add("filter-checkbox")
			let excludeCheckbox = document.querySelector("." + lineClass + " .checkbox-container:nth-child(2)")
			excludeCheckbox!.classList.add("exclude")
			excludeCheckbox!.classList.add("filter-checkbox")
		}
		new Setting(contentEl).addButton((btn) => btn
		.setButtonText("Submit")
		.setCta()
		.onClick(() => {
			this.resolve(this.result)
			this.close()              
		}))
	}
	onClose() {
		const {contentEl} = this
		contentEl.empty()
		if (this.result) {
			this.resolve(this.result)
		}
		this.reject("Task not submitted")
	} 
}






class MyTextInputModal extends Modal {
	resolve: any
	reject:any
	name: string
	defaultVal: string
	result: string
	constructor(app: App, name: string, defaultVal: string, resolve: any, reject:any) {
	  super(app);
	  this.resolve = resolve
	  this.reject = reject
	  this.name = name
	  this.defaultVal = defaultVal 
	  this.eventInput = this.eventInput.bind(this)
	}
	eventInput(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			this.resolve(this.result)
			this.close()
		}
	}
	onOpen() {
		const {contentEl} = this
		contentEl.createEl("h1", {text: this.name})
		const inputSetting = new Setting(contentEl)
		inputSetting.settingEl.style.display = "grid";
		inputSetting.addTextArea((text) => {
			text.setValue(this.defaultVal)
			this.result = this.defaultVal
			text.onChange((value) => {
			   this.result = value
			})
			text.inputEl.style.width = "100%";
			text.inputEl.rows = 10
		})
		new Setting(contentEl).addButton((btn) => btn
		.setButtonText("Сохранить")
		.setCta()
		.onClick(() => {
			this.resolve(this.result)
			this.close()
		}))
		contentEl.addEventListener("keydown", this.eventInput)
	}
	onClose() {
		const {contentEl} = this
		contentEl.empty()
		this.contentEl.removeEventListener("keydown", this.eventInput)
		this.reject("Not submitted") 
	} 
}








class MyNumberInputModal extends Modal {
	resolve: any
	reject:any
	name: string
	defaultVal: number | null
	result: number | null
	constructor(app: App, name: string, defaultVal: number | null, resolve: any, reject:any) {
	  super(app);
	  this.resolve = resolve
	  this.reject = reject
	  this.name = name
	  this.defaultVal = defaultVal 
	  this.eventInput = this.eventInput.bind(this)
	}
	eventInput(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			this.resolve(this.result)
			this.close()
		}
	}
	onOpen() {
		const {contentEl} = this
		contentEl.createEl("h1", {text: this.name})
		const inputSetting = new Setting(contentEl)
		inputSetting.settingEl.style.display = "grid";
		inputSetting.addButton((btn) => btn
		.setButtonText("-")
		.setCta()
		.onClick(() => {
			this.result = Number(this.result! - 1)
			let inputEl: HTMLInputElement | null = contentEl.querySelector(".number-input-el")
			inputEl!.value = this.result + ""
		}))
		inputSetting.addText((text) => {
			text.inputEl.type = "number"
			text.inputEl.className = "number-input-el"
			text.setValue(this.defaultVal + "")
			this.result = this.defaultVal
			text.onChange((value) => {
			   if (value && value != "") {
				this.result = Number(value)
			   } else {
				this.result = null
			   }
			})
			text.inputEl.style.width = "100%";
		})
		inputSetting.addButton((btn) => btn
		.setButtonText("+")
		.setCta()
		.onClick(() => {
			this.result = Number(this.result) + 1
			let inputEl: HTMLInputElement | null = contentEl.querySelector(".number-input-el")
			inputEl!.value = this.result + ""
		}))
		new Setting(contentEl).addButton((btn) => btn
		.setButtonText("Сохранить")
		.setCta()
		.onClick(() => {
			this.resolve(this.result)
			this.close()
		}))
		contentEl.addEventListener("keydown", this.eventInput)
	}
	onClose() {
		const {contentEl} = this
		contentEl.empty()
		this.contentEl.removeEventListener("keydown", this.eventInput)
		this.reject("Not submitted") 
	} 
}





class MyDateInputModal extends Modal {
	resolve: any
	reject:any
	name: string
	defaultVal: string
	result: string
	constructor(app: App, name: string, defaultVal: string, resolve: any, reject:any) {
	  super(app);
	  this.resolve = resolve
	  this.reject = reject
	  this.name = name
	  this.defaultVal = defaultVal 
	  this.eventInput = this.eventInput.bind(this)
	}
	eventInput(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			this.resolve(this.result)
			this.close()
		}
	}
	onOpen() {
		const {contentEl} = this
		contentEl.classList.add("date-input-modal")
		contentEl.createEl("h1", {text: this.name})
		const inputSetting = new Setting(contentEl)
		inputSetting.settingEl.style.display = "grid";
		inputSetting.addText((text) => {
			text.setValue(this.defaultVal)
			this.result = this.defaultVal
			text.onChange((value) => {
			   this.result = value
			})
			text.inputEl.style.width = "100%";
			text.inputEl.type = "date"
		})
		new Setting(contentEl).addButton((btn) => btn
		.setButtonText("Сохранить")
		.setCta()
		.onClick(() => {
			this.resolve(this.result)
			this.close()
		}))
		contentEl.addEventListener("keydown", this.eventInput)
	}
	onClose() {
		const {contentEl} = this
		contentEl.empty()
		this.contentEl.removeEventListener("keydown", this.eventInput)
		this.reject("Not submitted") 
	} 
}






class MyDateTimeInputModal extends Modal {
	resolve: any
	reject:any
	name: string
	defaultVal: string
	result: string
	constructor(app: App, name: string, defaultVal: string, resolve: any, reject:any) {
	  super(app);
	  this.resolve = resolve
	  this.reject = reject
	  this.name = name
	  this.defaultVal = defaultVal 
	  this.eventInput = this.eventInput.bind(this)
	}
	eventInput(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			this.resolve(this.result)
			this.close()
		}
	}
	onOpen() {
		const {contentEl} = this
		contentEl.classList.add("date-input-modal")
		contentEl.createEl("h1", {text: this.name})
		const inputSetting = new Setting(contentEl)
		inputSetting.settingEl.style.display = "grid";
		inputSetting.addText((text) => {
			text.setValue(this.defaultVal)
			this.result = this.defaultVal
			text.onChange((value) => {
			   this.result = value
			})
			text.inputEl.style.width = "100%";
			text.inputEl.type = "datetime-local"
		})
		new Setting(contentEl).addButton((btn) => btn
		.setButtonText("Сохранить")
		.setCta()
		.onClick(() => {
			this.resolve(this.result)
			this.close()
		}))
		contentEl.addEventListener("keydown", this.eventInput)
	}
	onClose() {
		const {contentEl} = this
		contentEl.empty()
		this.contentEl.removeEventListener("keydown", this.eventInput)
		this.reject("Not submitted") 
	} 
}





class TaskListInputModal extends Modal {
	taskList: HTMLElement
	constructor(app: App, taskList: HTMLElement) {
		super(app);
		this.taskList = taskList
	}
	async onOpen() {
	  const {contentEl} = this
	  contentEl.createEl("h1", {text: "Tasks"})
	  contentEl.append(this.taskList)
	  new Setting(contentEl).addButton((btn) => btn
		.setButtonText("Close")
		.setCta()
		.onClick(() => {
		  this.close()
	  }))
	}
	onClose() {
		const {contentEl} = this
		contentEl.empty()
	} 
}







interface PropObject {
	prop: string;
	filter: boolean;
	column: boolean;
	name: string;
	span: boolean;
	multiSelect: boolean;
	buttonName: string;
	icon: string;
	fuzzySearch: boolean; 
	valueOptions: string[];
	defaultValue: string;
	hideOnMobile: boolean;
	propVal: string;
	propMax: string;
	slice: any[];
	replace: any[];
	image: boolean;
	width: number;
	maxWidth: number;
	minWidth: number;
	height: number;
	maxHeight: number;
	minHeight: number;
	prepend: any;
	hideInCardsView: boolean;
	editButton: string;
	alignBottom: boolean;
	ignoreFilter: boolean;
}

interface Link {
	path: string;
	display?: string;
	subpath?: string;
	embed: boolean;
	type: "file" | "header" | "block";
}



interface MultiFilter {
	include: any[];
	exclude: any[];
	allValues: boolean;
}



















class API {
	app: App
	plugin: MyPlugin
	dv: any
	props: PropObject[]

	constructor(app: App, plugin: MyPlugin) {
		this.app = app
		this.plugin = plugin
	}







	async refreshView() {
		setTimeout(async() => {
			this.app.workspace.trigger("dataview:refresh-views");   
		}, 250)
	}

	async forceRefreshView() {
		Dataview.getAPI().index.touch()
		setTimeout(async() => {
			this.app.workspace.trigger("dataview:refresh-views");   
		}, 250)
	}

	async forceRefreshViewImmediately() {
		Dataview.getAPI().index.touch()
		this.app.workspace.trigger("dataview:refresh-views");
	}




	/* Modal calls */
	
	async suggester(values: string[], names?: string[]) {
		let data = new Promise((resolve, reject) => {
			new MySuggestModal(this.app, this.plugin, resolve, reject, values, names).open()  
		})
		return data
	}


	async fuzzySuggester(values: string[], names?: string[]) {
		let data = new Promise((resolve, reject) => {
			new MyFuzzySuggestModal(this.app, this.plugin, resolve, reject, values, names).open()  
		})
		return data
	}


	async multiSuggestDouble(header: string, values: string[], names: string[], existingValues: any): Promise<MultiFilter> {
		let data: Promise<MultiFilter> = new Promise((resolve, reject) => {
			new MyMultiSuggestModal(this.app, header, values, names, existingValues, resolve, reject).open()  
		})
		return data
	}


	async textInput(name: string, defaultVal: string) {
		if (!defaultVal) {defaultVal = ""}
		let data = new Promise((resolve, reject) => {
			new MyTextInputModal(this.app, name, defaultVal, resolve, reject).open()  
		}).catch((e) => {console.log(e)})
		return data
	}


	async numberInput(name: string, defaultVal: number|null) {
		if (!defaultVal && defaultVal !== 0) {defaultVal = null}
		let data = new Promise((resolve, reject) => {
			new MyNumberInputModal(this.app, name, defaultVal, resolve, reject).open()  
		}).catch((e) => {console.log(e)})
		return data
	}


	async dateInput(name: string, defaultVal: string) {
		if (!defaultVal) {defaultVal = ""}
		let data = new Promise((resolve, reject) => {
			new MyDateInputModal(this.app, name, defaultVal, resolve, reject).open()  
		}).catch((e) => {console.log(e)})
		return data
	}


	async dateTimeInput(name: string, defaultVal: string) {
		if (!defaultVal) {defaultVal = ""}
		let data = new Promise((resolve, reject) => {
			new MyDateTimeInputModal(this.app, name, defaultVal, resolve, reject).open()  
		}).catch((e) => {console.log(e)})
		return data
	}


	async taskListModal(page: any) {
		let taskList = document.createElement("ul")
		if (page.file && page.file.tasks) {
			let tasks = page.file.tasks
			taskList.className = "contains-task-list has-list-bullet"
			for (let task of tasks) {
				let taskLine = document.createElement("li")
				taskLine.classList.add("task-list-item")
				taskLine.setAttribute('data-task', task.status)
				let checkbox = document.createElement("input")
				checkbox.type = "checkbox"
				checkbox.classList.add("task-list-item-checkbox")
				checkbox.classList.add("file-task-checkbox")
				checkbox.onchange = async() => {
					let path = page.file.path
					let lineNum = task.line
					let file = this.app.vault.getAbstractFileByPath(path) as TFile
					let content = await this.app.vault.cachedRead(file)
					let lines = content.split("\n")
					let line = lines[lineNum]
					if (checkbox.checked) {
						line = line.replace("- [ ]", "- [x]")
					} else {
						line = line.replace("- [x]", "- [ ]")
					}
					lines[lineNum] = line
					let newContent = lines.join("\n")
					await this.app.vault.modify(file, newContent)
					await this.refreshView()
				}
				if (task.checked) {
					taskLine.classList.add("is-checked")
					checkbox.setAttribute('checked','checked')
				}
				taskLine.append(checkbox)
				taskLine.append(task.text.replaceAll("\n", ""))
				taskList.append(taskLine)
			}
		}
		new TaskListInputModal(this.app, taskList).open()
	}





	/* Utils */

	// Check if inside link

	isLink(val: any) {
		if (val && val.path) {
			return true
		} else return false
	}


	// Check if url string

	isUrl(val: any) {
		if (val && typeof val == "string" && val.startsWith("http")) {
			return true
		} else return false
	}


	// Fix for wrong properties, where it is text instead of list

	fixList(prop: any) {
		if (prop && !Array.isArray(prop)) {
			prop = [prop]
		}
		return prop
	}


	// Get property type (try to find saved type in Obsidian, then handle exceptional types)

	getPropType(prop: string) {
		//@ts-ignore
		let propTypes = this.app.metadataTypeManager.properties
		let type
		prop = prop.toLowerCase()
		if (propTypes[prop] && propTypes[prop].type) {
			type = propTypes[prop].type
		}
		if (prop.startsWith("file.")) type = "no filter"
		if (prop == "file.path" ||
		  prop == "file.name" ||
		  prop == "file.link" ||
		  prop == "file.folder" ||
		  prop == "file.ext") {
			type = "text"
		} else if (prop == "file.outlinks" ||
		  prop == "file.inlinks" ||
		  prop == "file.etags" ||
		  prop == "file.tags" ||
		  prop == "file.aliases" ||
		  prop == "tags" ||
		  prop == "aliases") {
			type = "multitext"
		} else if (prop == "file.cday" ||
		  prop == "file.mday") {
			type = "date"
		} else if (prop == "file.ctime" ||
		  prop == "file.mtime") {
			type = "datetime"
		} else if (prop == "file.starred") {
		  type = "checkbox"
		} else if (prop == "taskProgress" || prop == "slider") {
		  type = "no prop"
		}
		if (!type) type = "text"
		return type
	}
	
	

	getVal(page: any, prop: string) {
		let val = page[prop]
	  if (prop.startsWith("file.")) {
		  let propLevels = prop.split(".")
		  val = page
		  for (let level of propLevels) {
			val = val[level]
		  }
		}
	  if (prop == "tags") val = page.file.etags
	  return val
	}



	// Check if prop is link and path is given string

	containsPath(prop:any, text:string) {
		if (prop && prop.path && prop.path == text) {
		return true
		} else return false
	}
  
	listContainsPath(prop:any, text:string) {
		if (prop && Array.isArray(prop) && prop.find(p => p.path && p.path == text)) {
		return true
		} else if (prop && Array.isArray(prop)) {
		prop = prop.filter(p => p.path)
		for (let property of prop) {
			if (!property.path.match(".md") && (text == property.path + ".md" || text.match("/" + property.path + ".md"))) {
			return true
			}
		}
		} else return false
	}


	
	
	getWikilinkPath(wikilink: string) {
		const {dv} = this
		let barelink = wikilink.replace("[[", "").replace("]]", "")
		return dv.page(barelink).file.path
	}
	
	
	getValues(prop: string) {
		//@ts-ignore
		let values: any[] = this.app.metadataCache.getFrontmatterPropertyValuesForKey(prop)
		if (prop == "tags") {
			values = values.map(v => v.replace("#", ""))  
			values.sort()
		}
		values = [...new Set(values)]
		values.unshift("")
		return values
	}
	

	getValueNames(values: string[], filter: any) {
		let valueNames = values.map((v) => {
			if (v == "all") return "-all-"
			if (filter == v || (
				v.startsWith("[[") && filter && filter.path == this.getWikilinkPath(v)
				)      
			) {
				v = v + " ✔"
			}
			return v
		})
		return valueNames
	}












	async changeViewButton(container: HTMLElement, id: string) {
		const {dv} = this
        let currentView = dv.current()["view_" + id]
        if (!currentView) {
            currentView = "table"
        }
        let icon = "table-2"
        if (currentView == "list") {
            icon = "list"
        }
        if (currentView == "cards") {
            icon = "layout-grid"
        }
        let button = document.createElement("button")
        let iconWrapper = document.createElement("span")
        iconWrapper.className = "change-view-button-icon"
        setIcon(iconWrapper, icon)
        button.append(iconWrapper)
        button.className = "dvit-button change-view-button"
        button.onclick = async () => {
            await this.changeView(id)    
        }
        container.append(button)
	}


	async changeView(id: string) {
		const {dv} = this
        let currentFile = this.app.vault.getAbstractFileByPath(dv.current().file.path) as TFile
        let currentView = dv.current()["view_" + id]
        let views = ["table", "cards", "list"]
        let view = await this.suggester(views)
        if (view && view != currentView) {
            await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
                frontmatter["view_" + id] = view
            })
        }
        await this.refreshView()
	}





	async sortButton(props: PropObject[], container: HTMLElement, id: string) {
		const {dv} = this
		let current = dv.current()
		let sortDirProp = "sort_direction_" + id
		let sortDir = current[sortDirProp]
		let file = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
		let sortProp = "sort_" + id
		let icon = "sort-desc"
		if (sortDir == "desc") {
			icon = "sort-asc"
		}
		let propVals = props.map(p => p.prop)
		propVals.unshift("-")
		let propNames = props.map(p => {
			if (p.name) {
				return p.name
			} else return p.prop
		})
		propNames.unshift("-")
		let button = document.createElement("button")
		let iconWrapper = document.createElement("span")
		iconWrapper.className = "change-view-button-icon"
		setIcon(iconWrapper, icon)
		button.append(iconWrapper)
		button.className = "dvit-button sort-button"

		button.onclick = async () => {
			let prop = await this.suggester(propVals, propNames)
			if (prop == "-") {
				await this.app.fileManager.processFrontMatter(file, fm => {
					delete fm[sortProp]
					delete fm[sortDirProp]
				})
				await this.refreshView()  
			} else {
				await this.app.fileManager.processFrontMatter(file, (fm) => {
					if (fm[sortProp] == prop) {
						if (!fm[sortDirProp] || fm[sortDirProp] == "desc") {
							fm[sortDirProp] = "asc"
						} else {
							fm[sortDirProp] = "desc"
						}	
					} else {
						fm[sortProp] = prop
						fm[sortDirProp] = "asc"
					}
				})
				await this.refreshView()
			}
		}
		container.append(button)
	}



	sortByProp(pages: any, prop:string, dir: string) {
		if (prop && !prop.startsWith("file.")) {
			pages = pages.sort((p:any) => p[prop], dir)
		} else if (prop && prop.startsWith("file.")) {
			prop = prop.replace("file.", "")
			pages = pages.sort((p:any) => p.file[prop], dir)
		}
		return pages
	}







	// Create buttons to change filters

	async filterButtonProps(props: PropObject[], pages: any[], container: HTMLElement, id: string) {
		props = props.filter(p => p.filter)
		for (let p of props) {
			await this.filterButton(p, pages, container, id)
		}
	}



	async filterButton(p: PropObject, pages: any[], container: HTMLElement, id: string) {
		const {dv} = this
		let {prop, multiSelect, name, buttonName} = p
		let current = dv.current()
		let propName = "filter_" + id + "_" + prop
		
		if (!buttonName) {
		  buttonName = prop
		  if (name) {
			buttonName = name
		  }
		}

		if (p.ignoreFilter) {
			buttonName = current[propName]
		}
		
		
		let buttonClass = "dvit-button"
	
		if (current[propName] && current[propName] != "all" && current[propName].length != 0) {
			buttonClass = "dvit-button button-selected"
		}
		if (propName == "filter_" + id +"_file.tasks" && current[propName]) {
			buttonClass = "dvit-button button-selected"
		}

		if (p.ignoreFilter && current[propName] == p.defaultValue) {
			buttonClass = "dvit-button"
		}
		
		if (multiSelect) {
			let propNameInclude = "filter_include_" + id + "_" + prop
			let propNameExclude = "filter_exclude_" + id + "_" + prop
			if ((current[propNameInclude] && current[propNameInclude].length != 0) || 
			(current[propNameExclude] && current[propNameExclude].length != 0)) {
				buttonClass = "dvit-button button-selected"
			}
		}
	
		let button = document.createElement("button")
		let buttonInner: any = buttonName

		if (p.icon) {
			let iconWrapper = document.createElement("span")
			iconWrapper.className = "filter-button-icon"
			let iconEl = getIcon(p.icon)
			if (iconEl) {
				setIcon(iconWrapper, p.icon)
			} else iconWrapper.append("NO ICON")
			button.append(iconWrapper)
			if (buttonName.trim() != "") {
				let textWrapper = document.createElement("span")
				textWrapper.innerHTML = buttonName
				buttonInner = textWrapper
			}
		}

		button.append(buttonInner)
		button.className = buttonClass
		button.onclick = async () => {
			await this.changeProp(p, pages, id)    
		}
		container.append(button)
	}














	// Filter


	async filterProps(props: PropObject[], pages: any[], id: string) {
		const {dv} = this
		for (let prop of props) {
			if (!prop.ignoreFilter) {
				pages = await this.filter(prop, pages, id)
			}
		}
		let search = dv.current()["search_" + id]
		if (search && search.length > 0) {
			let keyWords = search.split(" ")
			for (let key of keyWords) {
				if (key.length > 0) {
					pages = pages.filter(page => page.file.name.toLowerCase().includes(key.toLowerCase()))
				}
			}
		}
		return pages
	}


	async filter(p: PropObject, filteredPages: any[], id: string) {
		let {dv, isLink, containsPath, listContainsPath, fixList, getVal} = this
		const current = dv.current()
		let { prop, multiSelect } = p
		let propType = this.getPropType(prop)
		let propName = "filter_" + id + "_" + prop
		let filter = current[propName]
		
		if (propType == "text" || propType == "number") {
			if (filter == "-") {
			  return filteredPages.filter(p => !getVal(p, prop))
			} else if (isLink(filter)) {
			  return filteredPages.filter(p => containsPath(getVal(p, prop), filter.path))
			} else if (filter && filter != "all") {
			if (prop == "file.folder") {
				return filteredPages.filter(p => getVal(p, prop).startsWith(filter))
			} else return filteredPages.filter(p => getVal(p, prop) == filter)
			} else {
			  return filteredPages 
			}
		}
	
		if (propType == "multitext") {
			if (multiSelect) {
				let includePropName = "filter_include_" + id + "_" + prop
				let excludePropName = "filter_exclude_" + id + "_" + prop
				let allValuesPropName = "filter_all_values_" + id + "_" + prop
				let includeFilter = current[includePropName]
				let excludeFilter = current[excludePropName]
				let allValues = current[allValuesPropName]
				if (!includeFilter) {
					includeFilter = []
				} 
				if (!excludeFilter) {
					excludeFilter = []
				} 
				if (allValues) {
					for (let f of includeFilter) {
						if (f == "-") {
							filteredPages = filteredPages.filter(p => !getVal(p, prop) || getVal(p, prop).length == 0)
						} else if (isLink(f)) {
							filteredPages = filteredPages.filter(p => {
								let val = fixList(getVal(p, prop))
								return listContainsPath (val, f.path)
							})
						} else if (f) {
							filteredPages = filteredPages.filter(p => {
								let val = getVal(p, prop)
								if (!val) {return false} else {
								return val.includes(f)
								}
							})
						} 
					}
	
					for (let f of excludeFilter) {
						if (f == "-") {
							filteredPages = filteredPages.filter(p => getVal(p, prop) && getVal(p, prop).length != 0)
						} else if (isLink(f)) {
							filteredPages = filteredPages.filter(p => {
								let val = fixList(getVal(p, prop))
								return !val || !val.find((link: Link) => link.path == f.path)
							})
						} else if (f) {
							filteredPages = filteredPages.filter(p => {
								let val = getVal(p, prop)
								if (!val) {return true} else {
								return !val.includes(f)
								}
							})
						} 
					}
				} else {
					if (includeFilter.length > 0) {
						filteredPages = filteredPages.map(p => {
							let val = getVal(p, prop)
							for (let f of includeFilter) {
								if (f == "-" && (!val || val.length == 0)) {
									return p
								} else if (f && f.path && (val && val.find((link: Link) => link.path == f.path))){
									return p
								} else if (f && val && val.includes(f)) {
									return p
								}
							}
							return false   
						})
						filteredPages = filteredPages.filter(p => p)  
					}
	
					if (excludeFilter.length > 0) {
						filteredPages = filteredPages.map(p => {
							let val = getVal(p, prop)
							for (let f of excludeFilter) {
								if (f == "-" && (!val || val.length == 0)) {
									return p
								} else if (f.path && (!val || !val.find((link: Link) => link.path == f.path))){
									return p
								} else if (!val || !val.includes(f)) {
									return p
								}
							}
							return false   
						})
						filteredPages = filteredPages.filter(p => p)  
					}
				}
				return filteredPages
			} else {
				if (filter == "-") {
					filteredPages = filteredPages.filter(p => !getVal(p, prop) || getVal(p, prop).length == 0)
				} else if (isLink(filter)) {
					filteredPages = filteredPages.filter(p => {
						let val = fixList(getVal(p, prop)) 
						return listContainsPath (val, filter.path)
					})
				} else if (filter && filter != "all") {
					filteredPages = filteredPages.filter(p => {
						let val = getVal(p, prop)
						if (!val) {return false} else {
						return val.includes(filter)
						}
					})
				} 
				return filteredPages
			}
		}
	
		if (propType == "checkbox") {
			if (filter == "-") {
				return filteredPages.filter(p => getVal(p, prop) === undefined)
			} else if (filter === false) {
				return filteredPages.filter(p => getVal(p, prop) === false || getVal(p, prop) === null)	
			 } else if (filter != "all" && filter != null) {
				  return filteredPages.filter(p => getVal(p, prop) == filter)
			} else return filteredPages
		}
		
		if (propType == "date") {
			if (filter == "-") {
				return filteredPages.filter(p => getVal(p, prop) === undefined)
			} else if (filter != "all" && filter != null) {
			  if (filter.isLuxonDateTime) {
				filter = filter.toFormat("yyyy-MM-dd")
			  }
			  return filteredPages.filter(p => {
				let val = getVal(p, prop)
				if (val) {
				  return val.toFormat("yyyy-MM-dd") == filter
				}
				else return false
			  })
			} else return filteredPages
		}
		
		if (propType == "datetime") {
			if (filter == "-") {
				return filteredPages.filter(p => getVal(p, prop) === undefined)
			} else if (filter != "all" && filter != null) {
			  if (filter.isLuxonDateTime) {
				filter = filter.toFormat("yyyy-MM-ddTHH:mm:ss")
			  }
			  return filteredPages.filter(p => {
				let val = getVal(p, prop)
				if (val) {
				  return val.toFormat("yyyy-MM-ddTHH:mm:ss") == filter
				} else return false
			  })
			} else return filteredPages
		}

		return filteredPages
	}








	
	async changeProp(p: PropObject, pages: any[], id: string) {
		const {dv} = this
		let current = dv.current()
		let { prop, multiSelect, fuzzySearch, valueOptions } = p
		let paginationProp = "pagination_" + id
		const getVal = this.getVal
		
		let suggester = async (values: string[], names: string[]) => {
			if (fuzzySearch) {
				return await this.fuzzySuggester(values, names)
			} else {
				return await this.suggester(values, names)
			} 
		}

		let propType = this.getPropType(prop)

		if (propType == "text") {
			let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
			let propName = "filter_" + id + "_" + prop
			let filter = current[propName]
			let values = pages.map(p => getVal(p, prop))

			values = values.map(v => {
				if (v && v.path) {
					let path = v.path.replace(".md", "")
					return  "[[" +  path + "]]"
				} else return v
			})

			values = [...new Set(values)]
			values = values.filter(v => v)
			values.sort()
			
			if (valueOptions) {
				values = valueOptions.filter(v => v)
			}

			if (!p.ignoreFilter) {
				values.unshift("-")
				values.unshift("all")
			}


			let valueNames = values.map((v) => {
				if (v == "all") return "-all-"
				if (filter && (filter == v || (filter.path && "[[" + filter.path.replace(".md", "") + "]]" == v))) {
					v = v + " ✔"
				}
				return v
			})

			let val = await suggester(values, valueNames)
			if (!val) {val = "-"}

			if (val == "all") {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					delete frontmatter[propName]
					frontmatter[paginationProp] = 0
				})
				
			} else {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					frontmatter[propName] = val
					frontmatter[paginationProp] = 0
				})
			}
		}

		if (propType == "number") {
			let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
			let propName = "filter_" + id + "_" + prop
			let values = pages.map(p => getVal(p, prop))
			values = [...new Set(values)]
			values = values.filter(v => v).map(v => v + "")
			values.sort()

			if (valueOptions) {
				values = valueOptions.filter(v => v).map(v => v + "")
			}

			values.unshift("-")
			values.unshift("all")

			let val = await this.suggester(values)
			if (!val) {val = "-"}
			
			if (val == "all") {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					delete frontmatter[propName]
					frontmatter[paginationProp] = 0
				})   
			} else {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					frontmatter[propName] = val
					frontmatter[paginationProp] = 0
				})
			}
		}

		if (propType == "date" || propType == "datetime") {
			let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
			let propName = "filter_" + id + "_" + prop
			let values = pages.map(p => {
			let val = getVal(p, prop)
			if (val && propType == "date") {
				val = val.toFormat("yyyy-MM-dd")
			} else if (val) {
				val = val.toFormat("yyyy-MM-ddTHH:mm:ss")
			}
			return val
			})
			
			values = [...new Set(values)]
			values = values.filter(v => v)
			values.sort()
			values.unshift("-")
			values.unshift("all")
			
		
			let dateFormat = Dataview.getAPI().settings.defaultDateFormat



			let locale = localStorage.getItem('language')
			
			let valueNames = values.map(v => {
			if (v == "all" || v == "-") {
				return v
			} else {
				return dv.date(v).toFormat(dateFormat, {locale: locale})
			}
			})

			let val = await suggester(values, valueNames)
			if (!val) {val = "-"}

			if (val == "all") {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					delete frontmatter[propName]
					frontmatter[paginationProp] = 0
				})
				
			} else {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					frontmatter[propName] = val
					frontmatter[paginationProp] = 0
				})
			}
		}
		
		if (propType == "multitext" && !multiSelect) {
			let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
			let propName = "filter_" + id + "_" + prop
			let filter = current[propName]

			let values = pages.map(p => {
				let val = getVal(p, prop)
				if (val) return val
				else return []     
			})
			
			let multiValues = []
			for (let v of values) {

				// Fix for wrong properties, where it is text instead of list
				if (!Array.isArray(v)) {
					v = [v]
				}    
				if (v) {
					for (let m of v) {
						multiValues.push(m)
					}
				} 
			}

			multiValues = multiValues.map(v => {
				if (v && v.path) {
					let path = v.path.replace(".md", "")
					return  "[[" +  path + "]]"
				} else return v
			})
		
			multiValues = [...new Set(multiValues)]
			multiValues = multiValues.filter(v => v)
			multiValues.sort()

			if (valueOptions) {
				multiValues = valueOptions.filter(v => v).map(v => v + "")
			}  

			multiValues.unshift("-")
			multiValues.unshift("all")

			let valueNames = multiValues.map((v) => {
				let valueName
				if (v == "all") valueName = "-all-"
				else valueName = v
				if (filter && (filter == v || (filter.path && "[[" + filter.path.replace(".md", "") + "]]" == v))) {
					return valueName + " ✔"
				} else return valueName
			})

			let val = await suggester(multiValues, valueNames)
			if (!val) {val = "-"}

			if (val == "all") {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					delete frontmatter[propName]
					frontmatter[paginationProp] = 0
				})
				
			} else {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					frontmatter[propName] = val
					frontmatter[paginationProp] = 0

				})
			}
		}

		if (propType == "multitext" && multiSelect) {
			let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
			let includePropName = "filter_include_" + id + "_" + prop
			let excludePropName = "filter_exclude_" + id + "_" + prop
			let allValuesPropName = "filter_all_values_" + id + "_" + prop
			let includeFilter = current[includePropName]
			let excludeFilter = current[excludePropName]
			let allValues = current[allValuesPropName]

			if (!allValues && allValues !== false) {
				allValues = false
			}

			if (!includeFilter) includeFilter = []
			else {
				includeFilter = includeFilter.map((f:any) => {
					if (f.path) return "[[" + f.path.replace(".md", "") + "]]"
					else return f
				})
			}

			if (!excludeFilter) excludeFilter = []
			else {
				excludeFilter = excludeFilter.map((f:any) => {
					if (f.path) return "[[" + f.path.replace(".md", "") + "]]"
					else return f
				})
			}

			let filter = {include: includeFilter, exclude: excludeFilter, allValues}

			let values = pages.map(p => {
				let val = getVal(p, prop)
				if (val) return val
				else return []
			})
			
			let multiValues = []
			for (let v of values) {

				// Fix for wrong properties, where it is text instead of list
				if (!Array.isArray(v)) {
					v = [v]
				}

				if (v) {
					for (let m of v) {
						multiValues.push(m)
					}
				} 
			}

			multiValues = multiValues.map(v => {
				if (v.path) {
					let path = v.path.replace(".md", "")
					return  "[[" +  path + "]]"
				} else return v
			})
		
			multiValues = [...new Set(multiValues)]
			multiValues = multiValues.filter(v => v)
			multiValues.sort()

			if (valueOptions) {
				multiValues = valueOptions.filter(v => v)
			}

			multiValues.unshift("-")

			let valueNames = multiValues.map((v) => {
				let valueName
				if (v == "all") valueName = "-all-"
				else if (v.startsWith("[[")) valueName = "⩈ " + v.replace(/(.*)(\/)([^\/]+)(\]\])/, "$3").replace(/(\[\[)(.*)(\]\])/, "$2")
				else valueName = v
				return valueName
			})

			let newFilter: MultiFilter = await this.multiSuggestDouble(prop, valueNames, multiValues, filter)


			if ((!newFilter.include || newFilter.include.length == 0) &&
			(!newFilter.exclude || newFilter.exclude.length == 0)) {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					delete frontmatter[includePropName]
					delete frontmatter[excludePropName]
					delete frontmatter[allValuesPropName]
					frontmatter[paginationProp] = 0
				})
				
			} else {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					frontmatter[includePropName] = newFilter.include
					frontmatter[excludePropName] = newFilter.exclude
					frontmatter[allValuesPropName] = newFilter.allValues
					frontmatter[paginationProp] = 0
				})
			}
		}

		if (propType == "checkbox") {
			let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
			let propName = "filter_" + id + "_" + prop

			let values = ["all", "-", "false", "true"]
			let val = await suggester(values, values)
			if (val == "false") val = false
			if (val == "true") val = true

			this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
				frontmatter[propName] = val
				frontmatter[paginationProp] = 0
			})
		}

		if (p.prop == "file.tasks") {
			let propName = "filter_" + id +"_file.tasks"
			let filter = current[propName]
			let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
			let values = ["all", "completed", "not completed"]

			let valueNames = values.map((v) => {
				if (v == "all") return "-all-"
				if (filter == v) {
					v = v + " ✔"
				}
				return v
			})

			let val = await suggester(values, valueNames)

			if (val == "all") {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					delete frontmatter[propName]
				})
				
			} else {
				await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
					frontmatter[propName] = val
				})
			}
		}
		await this.refreshView()
	}









	// Button to create new notes

	async newEntryButton(args: {noteName:string; noteTemplate:string; noteFolder:string}, container: HTMLElement) {
		const { noteName, noteTemplate, noteFolder } = args

		const checkIfExist = (num: number): string => {
			let numString = ""
			if (num > 0) {numString = " " + num}
			let path = noteName + numString + ".md"

			if (noteFolder && noteFolder != "") {
				path = noteFolder + "/" + noteName + numString + ".md"
			}

			//@ts-ignore
			let checkPath = this.app.vault.getAbstractFileByPathInsensitive(path)

			if (checkPath) {
				return checkIfExist(num + 1)
			} else return path
		}

		const createNote = async (openMode: string) => {
			let template = this.app.vault.getFiles().find(f => f.basename == noteTemplate)
			let data = ""
			if (template) {
				data = await this.app.vault.read(template)
			}
			let path = checkIfExist(0)
			let file = await this.app.vault.create(path, data)
			let leaf = this.app.workspace.getLeaf()
			if (openMode == "split view") {
				leaf = this.app.workspace.getLeaf("split", "vertical")
			} else if (openMode == "new tab") {
				leaf = this.app.workspace.getLeaf(true)
			}  
			if (openMode != "none") {
				leaf.openFile(file)
			}
			if (openMode == "none" || openMode == "split view") {
				await this.refreshView()
			}
		}

		let button = document.createElement("button")
		button.append("+")
		button.className = "dvit-button"
		button.onclick = async (e) => {
			if (e.ctrlKey && e.altKey) {
				await createNote("split view") 
			} else if (e.ctrlKey) {
				await createNote("new tab") 
			} else if (e.shiftKey) {
				await createNote("none") 
			}else {
				await createNote("same tab") 
			}
		}
		container.append(button)
	}





	// Refresh button

	async refreshButton(container: HTMLElement) {
		let button = document.createElement("button")
		button.append("↺")
		button.className = "dvit-button"
		button.onclick = async () => {
			await this.forceRefreshViewImmediately()
		}
		container.append(button)
	}






	// Search

	async searchButton(container: HTMLElement, id: string) {
		const {dv} = this
		let current = dv.current()
		let file = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
		let button = document.createElement("button")
	
		let iconEl = getIcon("search")
		let iconWrapper = document.createElement("span")
		iconWrapper.classList.add("search-button-icon")
		iconWrapper.append(iconEl!)
		
		button.append(iconWrapper)
		button.className = "dvit-button dvit-search-button"
	
		if (current["show_search_" + id]) {
			button.classList.add("button-selected")
		}
		button.onclick = async () => {
			await this.app.fileManager.processFrontMatter(file, fm => {
				if (current["show_search_" + id]) {
					delete fm["search_" + id]
				}
				fm["show_search_" + id] = !fm["show_search_" + id]
			})
			await this.refreshView()
		}
		container.append(button)
	}
	

	async searchInput(container: HTMLElement, id: string) {
		const {dv} = this
		let current = dv.current()
		let file = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
		let search = document.createElement("input")
		search.classList.add("dvit-search-input")
		search.value = current["search_" + id]
		if (!current["search_" + id]) search.value = ""
	
		search.addEventListener("keydown", async (e) => {
			if (e.key == "Enter") {
				await this.refreshView()
			}
		})
	
		search.oninput = async (e) => {
			await this.app.fileManager.processFrontMatter(file, fm => {
				fm["search_" + id] = search.value
			})
		}
		container.append(search)
	}











	// Pagination

	async increasePagination(increase:boolean, paginationProp: string) {
		const {dv} = this
		const current = dv.current()
		let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
		let pagination = current[paginationProp]
		if (!pagination) pagination = 0
		
		if (increase) {
			pagination++
			await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
				frontmatter[paginationProp] = Number(pagination)
			})
			await this.refreshView()
		}
	}



	async decreasePagination(paginationProp: string) {
		const {dv} = this
		const current = dv.current()
		let currentFile = this.app.vault.getAbstractFileByPath(current.file.path) as TFile
		let pagination = current[paginationProp]
		if (!pagination) pagination = 0
		if (pagination > 0) {
			pagination--
			await this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => { 
				frontmatter[paginationProp] = Number(pagination)
			})
			await this.refreshView()
		}
	}



	async nextPageButton(pagesCount: number, paginationProp: string) {
		const {dv} = this
		let current = dv.current()
		let pagination = current[paginationProp]
		if (!pagination) pagination = 0
		
		let buttonClass = "dvit-button"
		let increase = true
		if (pagination + 1 >= pagesCount) {
			buttonClass = "dvit-button button-gray"
			increase = false
		}
		
		let button = document.createElement("button")
		button.append(">>")
		button.className = buttonClass
		button.onclick = async () => {
			
			await this.increasePagination(increase, paginationProp)    
		}
		return button
	}

	
	
	async prevPageButton(paginationProp: string) {
		const {dv} = this
		let current = dv.current()
		let buttonClass = "dvit-button"
		let pagination = current[paginationProp]
		if (!pagination) pagination = 0
		
		if (pagination <= 0) {
			buttonClass = "dvit-button button-gray"
		}

		let button = document.createElement("button")
		button.append("<<")
		button.className = buttonClass
		button.onclick = async () => {
			await this.decreasePagination(paginationProp)    
		}
		return button
	}



	currentPagination(paginationProp: string) {
		const {dv} = this
		let pagination = dv.current()[paginationProp]
		if (!pagination) pagination = 0
		return +pagination + 1
	}
	


	async paginationBlock(filteredPages: any[], paginationNum: number, container: HTMLElement, id: string) {
		let paginationProp = "pagination_" + id
		let pagesLength = filteredPages.length
		let remainder = pagesLength % paginationNum
		let pagesCount = (pagesLength - remainder) / paginationNum
		if (remainder != 0) pagesCount++
		let prev = await this.prevPageButton(paginationProp)
		let next = await this.nextPageButton(pagesCount, paginationProp)
		let block = document.createElement("span")
		block.append(prev)
		block.append(this.currentPagination(paginationProp) + "")
		block.append(next)
		block.append(pagesCount + "")
		block.style.whiteSpace = "nowrap"
		container.append(block)
	}



	paginate(rows: any[], num: number, id: string) {
		const {dv} = this
		let paginationProp = "pagination_" + id
		let pagination = dv.current()[paginationProp]
		if (!pagination) pagination = 0
		return rows.slice(num * pagination, num * (+pagination + 1))
	}









	


	// EXTRA FUNCTIONS

	// Join tags to one string

	joinTags(arr: any[]) {
		let result = ""
		if (arr == null) {
			return ""
		} else {
			for (let a of arr) {
				result += a + " " 
			}
			return result
		}
	}
		

	// Join list values to one string and wrap them in spans with unique classes

	spanList(arr: any[]) {
		let result = ""
		if (arr == null) {
			return ""
		} else {
			for (let a of arr) {
				if (typeof a == "string" && !a.startsWith("<svg")) {
					result += "<span class='dv-tag dv-tag-" + a.replaceAll(" ", "-") + "'>" + a + "</span> "
				} else if (result.length == 0) {
					result = result + a
				} else result = result + ", " + a
			}
			return result
		}
	}



	// wrap text values in spans with unique classes

	spanSingle(val: any) {
		if (val == null) {
			return ""
		} else {
			return "<span class='dv-tag dv-tag-" + val.replaceAll(" ", "-") + "'>" + val + "</span> "
		}
	}
		
		
	

	// Progress bar based on task completion in note

	taskProgress(p: any) {
		let tasks: any[] = p.file.tasks
		tasks = tasks.filter(t => t.children.length == 0)
		let completed = tasks.filter(t => t.completed == true)
		let max = tasks.length
		let value = completed.length
		if (max > 0) {
			return "<div class='task-progress'><progress max=" + max + " value=" + value + "></progress> <span>" + value + " / " + max + "</span></div>"
		} else return ""
	}







	// Get canvas files and create mockup canvas pages array

	async getCanvasPages() {
	const {dv} = this
		let canvases = this.app.vault.getFiles().filter(f => f["extension"] == "canvas")
		canvases = [...canvases]
		
		let canvasPages = canvases.map((c: any) => {
			if (c.parent.path == "/" || !c.parent.path) {
				c.folder = ""
			} else {
				c.folder = c.parent.path + "/"
			}
			c.ext = c.extension
			c.name = c.basename + ".canvas"
			c.link = "[[" + c.folder + c.name + "|" + c.basename + "]]"
			return {file: c, type: "canvas"}
		})
		return dv.array(canvasPages)
	}






	getDisplay(link: Link) {
		let display = link.display
		if (!display) {
			display = link.path.replace(/(.*\/)([^/]+)(\.[^\.]+)/,"$2")
		}
		return display
	}





	renderTaskList(p: any, id: string) {
		const {dv} = this
		let taskList = document.createElement("ul")
		if (p.file && p.file.tasks) {
			let tasks = p.file.tasks

			let filterStatus = dv.current()["filter_" + id +"_file.tasks"]

			if (filterStatus == "completed") {
				tasks = tasks.filter((t: any) => t.status == "x")
			}

			if (filterStatus == "not completed") {
				tasks = tasks.filter((t: any) => t.status == " ")
			}
			
			taskList.className = "contains-task-list has-list-bullet"
			for (let task of tasks) {
				let taskLine = document.createElement("li")
				taskLine.classList.add("task-list-item")
				taskLine.setAttribute('data-task', task.status)
				let checkbox = document.createElement("input")
				checkbox.type = "checkbox"
				checkbox.classList.add("task-list-item-checkbox")
				checkbox.classList.add("file-task-checkbox")
				checkbox.setAttribute('data-path', p.file.path)
				checkbox.setAttribute('data-task-line', task.line)

				if (task.checked) {
					taskLine.classList.add("is-checked")
					checkbox.setAttribute('checked','checked')
				}

				taskLine.append(checkbox)
				taskLine.append(task.text.replaceAll("\n", ""))
				taskList.append(taskLine)
			}
		}
		return taskList
	}












		
	async createList(props: PropObject[], pages: any[], filteredPages: any[], paginationNum: number, container: HTMLElement, id: string) {
		const {dv} = this
		filteredPages = await this.filterProps(props, filteredPages, id)
	
		if (paginationNum) {
			filteredPages = this.paginate(filteredPages, paginationNum, id)
		}
		

		let links = filteredPages.map(page => {
			let link = page.file.link
			if (page.title) {
				link.display = page.title
			}
			return link
		})
	
		let list = dv.markdownList(links)
		let listWrapper = dv.paragraph(list)
		container.append(listWrapper)
	}










	


	async createTable(props: PropObject[], filteredPages: any[], paginationNum: number, container: HTMLElement, id: string, fullWidth:boolean, cardsView:any) {
		const {dv} = this
		this.props = props
		filteredPages = await this.filterProps(props, filteredPages, id)

		if (paginationNum) {
			filteredPages = this.paginate(filteredPages, paginationNum, id)
		}
		
		let tableProps = props.filter(p => p.column)

		//@ts-ignore
		if (this.app.isMobile) {
			tableProps = tableProps.filter(p => !p.hideOnMobile)
		}

		let headers = tableProps.map(propItem => {
			let icon = ""
			if (propItem.icon) {
				let iconEl = getIcon(propItem.icon)
				iconEl!.classList.add("header-icon")
				if (iconEl) {
					icon = iconEl.outerHTML
				} else icon = "NO ICON"
			}

			let prop = propItem.prop

			if (prop == "slider") {
				prop = propItem.propVal
			}

			let headerButton = document.createElement("div")
			headerButton.classList.add("header-sorting-button")
			headerButton.setAttribute("data-prop", prop)
			headerButton.setAttribute("data-view-id", id)

			let textWrapper = document.createElement("span")
			if (propItem.name) {
				textWrapper.innerHTML = propItem.name
			} else {
				textWrapper.innerHTML = propItem.prop
			}

			let text = textWrapper.outerHTML

			if (textWrapper.innerHTML.trim() == "") {
				text = ""
			}

			headerButton.innerHTML = icon + text
			return headerButton.outerHTML
		})



		let rows = filteredPages.map(p =>
			tableProps.map(propItem => {
				let propName = propItem.prop
				let propType = this.getPropType(propName)
				let propVal = this.getVal(p,propName)

				/* Slice text in list items*/

				if (propType == "multitext" && propItem.slice && propVal && Array.isArray(propVal)) {
					propVal = propVal.map(p => {
					if (p.path) {
						let display = p.display
						if (!display) {
						display = p.path.replace(/(.*?)([^\/]*)(\.md)/,"$2")
						}
						p.display = display.slice(...propItem.slice)
					} else {
						p = p.slice(...propItem.slice)
					}
					return p
					})
				}



				/* Replace text in list items*/

				if (propType == "multitext" && propItem.replace && propVal && Array.isArray(propVal)) {
					propVal = propVal.map(p => {
					if (p.path) {
						let display = p.display
						if (!display) {
						display = p.path.replace(/(.*?)([^\/]*)(\.md)/,"$2")
						}

						propItem.replace.forEach(r => {
							if (r[2] == "icon") {
								let iconEl = getIcon(r[1])
								if (iconEl) r[1] = iconEl.outerHTML.replace("svg-icon", "svg-icon dv-tag dv-tag-" + r[0])
							}
							p.display = display.replace(...r)
						}) 
					} else {
						propItem.replace.forEach(r => {
							if (r[2] == "icon") {
								
								let iconEl = getIcon(r[1])
							
								if (iconEl) {
									r[1] = iconEl.outerHTML.replace("svg-icon", "svg-icon dv-tag dv-tag-" + r[0])
								}
							}
							p = p.replace(...r)
						}) 
					}
					return p
					})
				}







				/* Slice text */
				
				if (propType == "text" && propItem.slice && propVal) {
				if (propVal.path) {
				let display = propVal.display
						if (!display) {
						display = propVal.path.replace(/(.*?)([^\/]*)(\.md)/,"$2")
						}
						propVal.display = display.slice(...propItem.slice)
				} else {
					propVal = propVal.slice(...propItem.slice)
				}
				}



				/* Wrap list items into span elements*/

				if (Array.isArray(propVal) && propItem.span) {
					propVal = this.spanList(propVal)
				}

				/* Wrap normal text into span element */

				if ((propType == "text") && !Array.isArray(propVal)  && propItem.span) {
					propVal = this.spanSingle(propVal)
				}
				
				

				/* Render property as image */
				
				if (propItem.image) {
				let imageWidth = 100
				if (propItem.width) imageWidth = propItem.width
				if ( propVal && propVal.path && !propVal.path.endsWith(".md")) {
						propVal = dv.fileLink(propVal.path, true, imageWidth)
					} else if (propVal && !propVal.path && propVal.startsWith("http")) {
						propVal = "![|" + imageWidth + "](" + propVal + ")"
					} else propVal = ""
				}



				/* Show file properties */

				if (propType == "file prop") {
					propVal = p.file[propName]

					
					
					if (propVal && propItem.slice) {
					if (propVal.path) {
						let display = propVal.display
						if (!display) {
						display = propVal.path.replace(/(.*?)([^\/]*)(\.md)/,"$2")
						}
						propVal.display = display.slice(...propItem.slice)
					} else {
						propVal = propVal.slice(...propItem.slice)
					}
					}
					
					if (propItem.prepend) {
						let prependText = ""
						if (propItem.prepend.type == "list") {
							let prependItems = p[propItem.prepend.prop]
						
							for (let item of prependItems) {
								if (propItem.prepend.slice) {
									item = item.slice(...propItem.prepend.slice).trim() 
								}
								prependText = prependText + item
							}
						} else if (propItem.prepend.type == "text") {
							prependText = p[propItem.prepend.prop]
						
							if (propItem.prepend.slice) {
								prependText = prependText.slice(...propItem.prepend.slice).trim()  
							}
						}
						propVal = prependText + " " + propVal 
					}
				}


				/* Show tags in one line */

				if (propName == "tags") {
					propVal = this.joinTags(p.file.etags)
				}



				/* Show task progress bar */

				if (propName == "taskProgress") {
					propVal = this.taskProgress(p)
				}


			/* Push property and everything after it to the bottom of the card */

				
				


				


				
				/* Make property elements editable */

				

					let editButton = document.createElement("div")
					editButton.classList.add("edit-button")


					if (propItem.hideInCardsView) {
						editButton.classList.add("hide-in-cards-view")
					}

		

				if (!propName.startsWith("file.")) {

					if (propItem.editButton == "select" && (propType == "text" || propType == "multitext")) {
						//editButton.classList.add("edit-button-select")
						editButton.setAttribute('data-type', 'select')

					}

					if (propType == "text" && propItem.editButton != "select") {
						editButton.setAttribute('data-type', 'text')

					}


					if (propType == "multitext" && propItem.editButton != "select") {
						//editButton.classList.add("edit-button-list")
						editButton.setAttribute('data-type', 'list')

					}


					if (propType == "date") {
						//editButton.classList.add("edit-button-date")
						editButton.setAttribute('data-type', 'date')

						if (propVal) {
							let dateFormat = Dataview.getAPI().settings.defaultDateFormat
							let locale = localStorage.getItem('language')
							propVal = propVal.toFormat(dateFormat, {locale: locale})
						} 
					}


					if (propType == "datetime") {
						//editButton.classList.add("edit-button-date")
						editButton.setAttribute('data-type', 'datetime')

						if (propVal) {
							let dateFormat = Dataview.getAPI().settings.defaultDateFormat + " HH: mm"
							let locale = localStorage.getItem('language')
							propVal = propVal.toFormat(dateFormat, {locale: locale})
						} 
					}




					if (propType == "number") {
						editButton.setAttribute('data-type', 'number')
					}

				}

				if (propName == "file.link" || propName == "file.name") {
					editButton.setAttribute('data-type', 'file name')
				}   				

					editButton.setAttribute('data-path', p.file.path)
					editButton.setAttribute('data-prop', propName)

					if (Array.isArray(propVal)) {
						let propArr = document.createElement("ul")
						for (let propElData of propVal) {
							let propEl = document.createElement("li")
							propEl.append(propElData)
							propArr.append(propEl)
						}
						propVal = propArr.outerHTML
					}
					editButton.innerHTML = propVal


		

					if (!editButton.innerHTML || editButton.innerHTML == "null" || editButton.innerHTML == "undefined" || editButton.innerHTML == "<ul></ul>") {
						editButton.innerHTML = propName
						if (propItem.name) editButton.innerHTML = propItem.name
						if (propItem.icon) {
							let iconWrapper = document.createElement("span")
							iconWrapper.classList.add("inline-icon")
							setIcon(iconWrapper, propItem.icon)

							let textWrapper = document.createElement("span")
							textWrapper.innerHTML = editButton.innerHTML

							editButton.innerHTML = ""
							editButton.append(iconWrapper)
							editButton.append(textWrapper)
						}
						editButton.classList.add("edit-button-empty")
					}


					let style = ""

					if (propItem.width) {
						style = style + "width: " + propItem.width + "px; "
					}

					if (propItem.maxWidth) {
						style = style + "max-width: " + propItem.maxWidth + "px; "
					}

					if (propItem.minWidth) {
						style = style + "min-width: " + propItem.minWidth + "px; "
					}

					if (propItem.height) {
						style = style + "height: " + propItem.height + "px; overflow-y: scroll; "
					}

					if (propItem.maxHeight) {
						style = style + "max-height: " + propItem.maxHeight + "px; overflow-y: scroll; "
					}

					if (propItem.minHeight) {
						style = style + "min-height: " + propItem.minHeight + "px; overflow-y: scroll; "
					}


					editButton.style.cssText = style


					propVal = editButton

					

				


			

				if (propType == "checkbox") {
					propVal = '<input type="checkbox" class="prop-checkbox" data-path="' + p.file.path + '" data-prop="' + propName + '">'
				}


				if (propName == "slider") {

					let propSliderVal = propItem.propVal
					let propMax = propItem.propMax

					let max = p[propMax]

					if (max) {
						let slider = '<input type="range" max=' + p[propMax] + ' step="1" class="slider table-property-slider" data-path="' + p.file.path + '" data-prop="' + propSliderVal + '" data-prop="' + propMax + '">'

						let sliderWrapper = document.createElement("div")
						sliderWrapper.innerHTML = slider
						propVal = sliderWrapper
					} else {
						propVal.innerHTML = "Slider"
						propVal.classList.add("edit-button-empty")
						propVal.setAttribute('data-type', 'number')
						propVal.setAttribute('data-prop', propMax)
					}

					
				}






				if (propName == "taskProgress") {
					editButton.setAttribute('data-type', 'task-progress')
				}



					if (propItem.alignBottom) {
						propVal.classList.add("align-bottom")
					} 


					if (propName == "file.tasks") {
						let taskList = document.createElement("ul")
						if (p.file && p.file.tasks) {
							let tasks: any[] = p.file.tasks

							let filterStatus = dv.current()["filter_" + id +"_file.tasks"]

							if (filterStatus == "completed") {
								tasks = tasks.filter(t => t.status == "x")
							}

							if (filterStatus == "not completed") {
								tasks = tasks.filter(t => t.status == " ")
							}

							
							taskList.className = "contains-task-list has-list-bullet"
							for (let task of tasks) {
								let taskLine = document.createElement("li")
								
								taskLine.classList.add("task-list-item")
								

								taskLine.setAttribute('data-task', task.status)

								let checkbox = document.createElement("input")
								checkbox.type = "checkbox"
								checkbox.classList.add("task-list-item-checkbox")
								checkbox.classList.add("file-task-checkbox")

								checkbox.setAttribute('data-path', p.file.path)
								checkbox.setAttribute('data-task-line', task.line)

								if (task.checked) {
									taskLine.classList.add("is-checked")
									checkbox.setAttribute('checked','checked')
								}
								
								taskLine.append(checkbox)
								taskLine.append(task.text.replaceAll("\n", ""))
								taskList.append(taskLine)
							}

							
						}
						propVal = this.renderTaskList(p, id)
					}



				return propVal
			}))
		


		let markdownTable = dv.markdownTable(headers, rows)
		markdownTable = markdownTable.replaceAll("&amp;", "&")
		let tableWrapper = dv.paragraph(markdownTable)
		container.append(tableWrapper)




		tableWrapper.classList.add("dv-table-wrapper")

		if (fullWidth) {
			tableWrapper.classList.add("full-width")
		}

		
		if (!cardsView) {
			tableWrapper.classList.add("table")
		}


		if (cardsView) {
			tableWrapper.classList.add("cards")
			if (cardsView.position) {
				tableWrapper.classList.add("cards-" + cardsView.position)
			}
		}


		



		/* Add actions for editing buttons */

		let editButtons = document.querySelectorAll(".edit-button")
		for (let b of editButtons) {
			let button = b as HTMLButtonElement
			button.onclick = async (event) => {
				let target = event.target as HTMLElement
				if (target.localName != "a") {
					let path = button.getAttribute("data-path") ?? ""
					let prop = button.getAttribute("data-prop") ?? ""
					let type = button.getAttribute("data-type") ?? ""
					await this.editProp(type, path, prop)
				} 
			}
		}


		



		let sliders = document.querySelectorAll(".table-property-slider")
		for (let s of sliders) {
			let slider = s as HTMLInputElement
			let prop = slider.getAttribute("data-prop") ?? ""
			let path = slider.getAttribute("data-path") ?? ""
			let page = dv.page(path)

			let val = page[prop]
			if (!val) val = 0
			slider.value = val

			this.updateSlider(slider)
			slider.oninput = async () => {
				this.updateSlider(slider)
				await this.editSlider(slider)
			}
			slider.ondblclick = async () => {
				await this.editSliderVal(slider)
			}

		}



		let checkboxes = document.querySelectorAll(".prop-checkbox")
		for (let c of checkboxes) {
			let checkbox = c as HTMLInputElement
			let prop = checkbox.getAttribute("data-prop") ?? ""
			let path = checkbox.getAttribute("data-path") ?? ""
			let page = dv.page(path)
			
			checkbox.checked = page[prop]

			checkbox.onchange = async() => {
				let file = this.app.vault.getAbstractFileByPath(path) as TFile
				await this.app.fileManager.processFrontMatter(file, (frontmatter) => { 
					frontmatter[prop] = checkbox.checked
				})
			}
		}



		let taskCheckboxes = document.querySelectorAll(".file-task-checkbox")
		for (let c of taskCheckboxes) {
			let checkbox = c as HTMLInputElement
			checkbox.onchange = async() => {
				
				let path = checkbox.getAttribute("data-path") ?? ""
				let lineNum: any = checkbox.getAttribute("data-task-line") ?? ""
				let file = this.app.vault.getAbstractFileByPath(path) as TFile
				let content = await this.app.vault.cachedRead(file)
				let lines = content.split("\n")
				let line = lines[lineNum]

				if (checkbox.checked) {
					line = line.replace("- [ ]", "- [x]")
				} else {
					line = line.replace("- [x]", "- [ ]")
				}

				lines[lineNum] = line

				let newContent = lines.join("\n")

				await this.app.vault.modify(file, newContent)

				await this.refreshView()
				
				
			}
			
		}




		let headerButtons = document.querySelectorAll(".header-sorting-button")
		for (let b of headerButtons) {
			let button = b as HTMLButtonElement

			let prop = button.getAttribute("data-prop")
			let id = button.getAttribute("data-view-id")
			let sortProp = "sort_" + id
			let sortDirProp = "sort_direction_" + id

			let file = this.app.vault.getAbstractFileByPath(dv.current().file.path) as TFile

			button.onclick = async () => {
				await this.app.fileManager.processFrontMatter(file, fm => {
					if (fm[sortProp] == prop) {
						if (!fm[sortDirProp] || fm[sortDirProp] == "desc") {
							fm[sortDirProp] = "asc"
						} else {
							fm[sortDirProp] = "desc"
						}
						
					} else {
						fm[sortProp] = prop
						fm[sortDirProp] = "asc"
					}
				})

				await this.refreshView()
			}


			button.onmousedown = async (e) => {
				if (e.button == 2) {
					await this.app.fileManager.processFrontMatter(file, fm => {
						delete fm[sortProp]
						delete fm[sortDirProp]
					})

					await this.refreshView()
				}
			}
		}
		
	}











	
/* Functions to edit properties */

updateSlider (slider: HTMLInputElement) {
    let value = slider.value
    let max = slider.max
    let percents = this.getSliderPercents(Number(value), Number(max))
    let imageColor = "var(--color-red)"
    if (percents > 25) imageColor = "var(--color-yellow)" 
    if (percents > 50) imageColor = "var(--color-green)"
    if (percents > 75) imageColor = "var(--color-cyan)"
    if (percents == 100) imageColor = "var(--color-purple)"
    slider.style.backgroundSize = percents + "% 100%"
    slider.style.backgroundImage = "linear-gradient(" + imageColor + ", " + imageColor + ")"
    setTooltip(slider, value, {placement: "top", delay: 1})
}


getSliderPercents (value: number, max: number) {
    let val = value
    if (!val) val = 0
    if (!max) {
        val = 0
        max = 0
    }

    if (Number(val) > Number(max)) {
        val = max
    }

    return Math.round(val * 100 / max)
}

async editSlider (slider: HTMLInputElement) {
    let path = slider.getAttribute("data-path") ?? ""
    let prop = slider.getAttribute("data-prop") ?? ""
    let file = this.app.vault.getAbstractFileByPath(path) as TFile
    await this.app.fileManager.processFrontMatter(file, (fm) => {
        fm[prop] = Number(slider.value)
    })
}

async editSliderVal (slider: HTMLInputElement) {
    let path = slider.getAttribute("data-path") ?? ""
    let prop = slider.getAttribute("data-prop") ?? ""
    await this.editProp("number", path, prop)
}


async editProp (type: string, path: string, prop: string) {

	const {dv} = this

    let page = dv.page(path)
    let file = this.app.vault.getAbstractFileByPath(path) as TFile

    if (type == "file name") {
        let prevName = file.basename
        let newName = await this.textInput("Title", prevName)
        if (!newName) newName = prevName
        let folder = file.parent!.path
        let ext = file.extension

        let newPath = newName + "." + ext
        if (folder != "/") {
            newPath = folder + "/" + newName + "." + ext
        }

        await this.app.vault.rename(file, newPath)

        await this.refreshView()

        return
    }

    let prevVal = page[prop]

    if (this.isLink(prevVal)) {

        prevVal = "[[" + prevVal.path + "|" + this.getDisplay(prevVal) + "]]"

    }

    if (Array.isArray(prevVal)) {
        prevVal = prevVal.map(p => {
            if (this.isLink(p)) {
                p = "[[" + p.path + "|" + this.getDisplay(p) + "]]"
            }
            return p
        })

    }

    let val: any

    if (type == "text") {
        val = await this.textInput(prop, prevVal)
        if (val === undefined) val = prevVal

    } else if (type == "list") {

        let values = this.getValues(prop)


        console.log(values)
        if (!values) values = []

        let propItem = this.props.find(p => p.prop == prop)
        let options = propItem!.valueOptions
        if (options) {
            values = [...options]
        }


        if (!prevVal) prevVal = []
        if (typeof prevVal == "string") prevVal = [prevVal]


        let addedValues = [...prevVal]

        let notAddedValues = values.filter(v => {
            for (let a of addedValues) {
                if (v == a) return false
            }
            if (v == "") return false
            return true
        })



        notAddedValues.unshift("+ add new option")
        
        let command = await this.suggester(["add", "remove"])

        if (command == "add") {
            let addVal = await this.suggester(notAddedValues)

            if (addVal && addVal != "+ add new option") {
                addedValues.push(addVal)
            } else if (addVal == "+ add new option") {
                addVal = await this.textInput(prop, "")
                if (addVal) {
                    addedValues.push(addVal)
                }
            }

        } else if (command == "remove") {
            let removeVal = await this.suggester(addedValues)

            if (removeVal) {
                addedValues = addedValues.filter(a => a != removeVal)
            }
        }

        val = addedValues

    } else if (type == "select") {

        let values = this.getValues(prop)
 
        let propItem = this.props.find(p => p.prop == prop)
        let options = propItem!.valueOptions
        if (options) {
            values = [...options]
        }
    

        values.unshift("+ add new option")

        let valueNames = values.map(v => {
            if (v == "") return "-" 
            else return v
        })


        val = await this.suggester(values, valueNames)

        if (val == "+ add new option") {
            val = await this.textInput(prop, "")
            if (val === undefined) val = prevVal
        }


        let propType = this.getPropType(prop)

        if (propType == "multitext") {
            if (val != "") {
               val = [val] 
            } else {
                val = []
            }
        }


    } else if (type == "number") {

        val = await this.numberInput(prop, prevVal)
        if (val === undefined) val = prevVal

    } else if (type == "date") {
     
        if (prevVal) {
            prevVal = prevVal.toISODate()
        }
        
        val = await this.dateInput(prop, prevVal)

        if (val === undefined) val = prevVal

        if (val == "") val = null
    } else if (type == "datetime") {
     
        if (prevVal) {
            prevVal = prevVal.toISODate()
        }
        
        val = await this.dateTimeInput(prop, prevVal)

        if (val === undefined) val = prevVal

        if (val == "") val = null
    } else if (type == "task-progress") {
        this.taskListModal(page)
    }

    if (val !== prevVal) {
        await this.app.fileManager.processFrontMatter(file, fm => {
            fm[prop] = val
        })

        await this.refreshView()
    }
}











	



























	async renderView (settings: any, props: any, pages: any, dv:any) {

		console.log("render")

		this.dv = dv
		let id = settings["id"] ?? "no-id"
		let viewContainer = dv.container.createEl("div", {cls: "dvit-view-id-" + id})
		let sortProp = dv.current()["sort_" + id]
		let sortDir = dv.current()["sort_direction_" + id]
		if (!sortDir) sortDir = "asc"
		pages = this.sortByProp(pages, sortProp, sortDir)
		let view = dv.current()["view_" + id]
		let cardsPosition = settings["cards image position"]
		let paginationNum = settings["entries on page"]
		let addNewButton = settings["add new note button"]
		let fullWidth = settings["full width"]

		if (addNewButton) {
			let noteName = settings["new note name"]
			let noteTemplate = settings["new note template"]
			let noteFolder = settings["new note folder"]
			if (!noteName) noteName = "New note"
			let args = {
				noteName, 
				noteTemplate, 
				noteFolder
			}
			await this.newEntryButton(args, viewContainer)
		}

		let filteredPages = [...pages]
		filteredPages = await this.filterProps(props, filteredPages, id)

		await this.filterButtonProps(props, pages, viewContainer, id)
		await this.changeViewButton(viewContainer, id)

		if (view == "list") {
			await this.sortButton(props, viewContainer, id)
		}

		await this.refreshButton(viewContainer)

		if (paginationNum) {
			await this.paginationBlock(filteredPages, paginationNum, viewContainer, id)
		}

		await this.searchButton(viewContainer, id)
		if (dv.current()["show_search_" + id]) {
			await this.searchInput(viewContainer, id)
		}

		if (!view || view == "table") {
			await this.createTable(props, filteredPages, paginationNum, viewContainer, id, fullWidth, null)
		
		} else if (view == "cards") {
			await this.createTable(props, filteredPages, paginationNum, viewContainer, id, fullWidth, {cards: true, position: cardsPosition})
		
		} else if (view == "list") {
			await this.createList(props, pages, filteredPages, paginationNum, viewContainer, id)
		}

		

		let search = viewContainer.querySelector(".dvit-search-input")
		if(search) {
			search.focus()
		} 

		
	}







	
	  
	  
	  
	  
	  

	








}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	api?: API 

	async onload() {

		let api = new API(this.app, this)
		this.api = api
		api.forceRefreshViewImmediately()
		
		this.registerEvent(
			
			this.app.metadataCache.on("dataview:index-ready" as any, async () => {
				await api.refreshView()
			})
		)

	}

	onunload() {
		delete this.api

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
