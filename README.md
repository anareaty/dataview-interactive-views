# Интерактивные таблицы для Dataview
[README on English](dataview-interactive-views)

https://github.com/user-attachments/assets/0855c051-33db-4808-ac86-1928d32c5353

## Описание

Этот плагин предназначен для использования в приложении Obsidian с плагином Dataview. С помощью Dataview вы можете создавать таблицы и списки из заметок, но их нельзя редактировать. Этот плагин позволяет вам создавать динамические интерактивные представления с несколькими дополнительными опциями:
- можно фильтровать таблицы по свойствам с помощью кнопок фильтрации;
- можно использовать пагинацию, чтобы разнести записи на отдельные страницы;
- можно легко переключаться между представлениями таблиц, карточек и списков;
- можно редактировать свойства прямо из таблицы, не открывая заметку;
- можно отображать свойства как изображения, функциональные чекбоксы и ползунки;
- можно использовать разные цвета для разных значений свойств;
- можно обновлять представление с помощью специальной кнопки;
- можно добавить кнопку для создания новой заметки;
- можно делать все это с минимальным редактированием кода.

## Установка

1. Установить плагин BRAT из списка плагинов сообщества.
2. Откройте настройки плагина BRAT.
3. Нажмите кнопку "Add Beta Plugin".
4. Вставьте в открывшуюся форму ссылку: https://github.com/anareaty/dataview-interactive-views
5. Убедитесь, что включена настройка "Enable after installing the plugin".
6. Нажмите кнопку "Add Plugin".

## Как настроить

1. Установите плагин Dataview и включите javascript в настройках плагина.
3. Скопируйте код ниже в заметку Obsidian:

````
```dataviewjs

// Выберите и отфильтруйте страницы как обычно с помощью dataviewjs.

let pages = dv.pages()

// Общие настройки представления

const settings = {
	"id": "view-1",
    "entries on page": 10,
    "full width": true,
    "add new note button": true,
}

// Настройки свойств

const props = [
  {
    prop: "file.link", 
    name: "Name",
    filter: true,
    column: true
  },
  {
    prop: "tags",
    filter: true,
    column: true
  }
] 

await DIViews.renderView(settings, props, pages, dv)
```
````

6. Отредактируйте код в соответствии с вашими потребностями (см. ниже).

## Как редактировать

Вы можете изменить представление, отредактировав объект "settings" и массив "props".

### Общие настройки

Объект "settings" содержит общие настройки представления. Он может содержать несколько необязательных параметров:

"id" — уникальный номер отображения (записывается без пробелов). Если вы хотите вставить несколько отображений в одну заметку, используйте разные id. Если только одно, id можно не писать. 

`"entries on page": <number>` — описывает, сколько записей должно быть на одной странице. Если вы пропустите этот параметр, пагинации не будет.

`"full width": true` — если вы хотите, чтобы таблица заполняла всю ширину страницы.

`add new note button": true` - если вы хотите добавить кнопку для создания новой заметки.

Если вы добавляете кнопку для создания заметки, вы также можете добавить параметры для новой заметки (необязательно).

`new note name: <string>` - название новой заметки.

`new note folder: <string>` - папка для создания новой заметки.

`new note template: <string>` - шаблон заметки.

Вы также можете изменить положение изображений карточек, добавив:

`"cards image position": "horizontal"`

В результате ваши настройки могут выглядеть следующим образом, например:

```js
const settings = {
"entries on page": 10,
"cards image position": "horizontal",
"full width": true,
"add new note button": true,
"new note name": "New book",
"new note folder": "Books",
"new note template": "Book template"
}
```

### Настройки свойств

Массив "props" описывает, какие свойства отображаются в представлении. Каждое свойство имеет свой собственный объект, содержащий несколько атрибутов. Например:

```
{
  prop: "Имя свойства",
  filter: true,
  column: true
}
```
Вот некоторые параметры, которые вы можете добавить к объекту свойства:

`prop: <string>` — имя свойства (обязательно).

`filter: true` — добавляет сверху кнопку фильтрации для этого свойства.

`column: true` — добавляет столбец в таблице для этого свойства.

`name: <string>` — если вы хотите использовать альтернативное имя для этого свойства в заголовке таблицы и на кнопке фильтрации.

`icon: <string>` — если вы хотите добавить иконку к имени свойства в заголовке таблицы и на кнопке фильтрации. Поддерживаются только встроенные значки lucide. Например, `icon: "send"`.

`image: true` — свойство будет отображаться как изображение. Для этого оно должен содержать либо внешнюю url-ссылку, либо вики-ссылку на локальное изображение.

`width: <number>` — задает ширину изображения.

`fuzzySearch: true` — разрешает нечеткий поиск в модальном окне фильтрации.

`span: true` — оборачивает значения свойств в теги span с уникальными именами классов. Позволяет использовать css для добавления разных цветов для разных значений.

`multiSelect: true` — позволяет выбирать несколько значений в модальном окне фильтрации. Работает только со свойствами типа "список".

`editButton: "select"` — позволяет выбирать только один из существующих вариантов в модальном окне редактирования. Работает со свойствами типа "текст" или "список".

`slice: [0, 2],` — отображать только первые два символа значения свойства (полезно для свойств, начинающихся с эмодзи).

`textHeight: <number>` — задает максимальную высоту текстового свойства в таблице.

`alignBottom: true` — в представлении карточек сдвинуть это свойство и все свойства после него в нижнюю часть карточки.

`hideOnMobile: true` — не показывать это свойство в таблице на мобильном.

`hideInCardsView: true` — не показывать это свойство, когда выбрано отображение с виде карточек.

`ignoreFilter: true` — не фильтровать заметки по этому свойству. При этом вы всё ещё можете задать кнопку фильтрации, которая будет изменять значения во фронтмэттере, но они не будут влиять на отображение. Это может быть полезно, если вы хотите прописать собственные кастомные фильтры.

Помимо обычных свойств вы также можете использовать некоторые свойства файла, такие как "file.link" или "file.path". Обратите внимание, что большинство из них пока не редактируются, за исключением имени заметки. Вы можете использовать только свойства файла первого уровня.

Вы можете использовать свойство `file.tasks`, чтобы получить список задач из заметок с активными чекбоксами, а кнопка фильтрации позволит переключаться между просмотром всех задач, только выполненных или только не выполненных. Но поддержка задач пока что минимальна и может немного глючить.

Еще две штуки, кроме свойств, которые вы можете поместить в массив "props", это прогресс-бар и ползунок.

Прогресс-бар позволяет вам видеть прогресс выполнения всех задач в заметке. Он описывается следующим образом:

```
{
    prop: "taskProgress",
    column: true  
}
```

Ползунок позволяет редактировать свойства перетаскиванием. Это может быть полезно, например, для отслеживания того, сколько глав книги вы прочитали и т.д. Он описывается так:

```
  {
    prop: "slider",
    column: true,
    propVal: "Value",
    propMax: "Max"
}
```

Для ползунка требуются два свойства: максимальное значение и текущее значение. Если в заметке нет максимального значения, вы можете задать его, щелкнув по ячейке ползунка. Двойной щелчок по ползунку позволяет ввести значение как число.

## Дополнительные стили

Использование этого скрипта добавляет некоторые дополнительные свойства в заметку с представлением. Они необходимы для хранения информации о фильтрах и других выбранных параметрах. При желании вы можете скрыть эти свойства, добавив css-snippet:

```css
/* Скрыть свойства интерактивной таблицы */

.metadata-property[data-property-key*="filter"],
.metadata-property[data-property-key="view"],
.metadata-property[data-property-key="pagination"],
.metadata-property[data-property-key="search"],
.metadata-property[data-property-key="show_search"],
.metadata-property[data-property-key="sort"],
.metadata-property[data-property-key="sort_direction"] {
  display: none;
}
```

Вы также можете использовать css для изменения цветов определенных значений свойств. Для этого необходимо добавить параметр `span: true` к объекту свойства. Затем необходимо создать css-сниппет. Например, у вас есть свойство «Статус» с возможными значениями «в процессе» и «завершено», и вы хотите, чтобы «в процессе» выделялось красным, а «завершено» — зеленым цветом. Вы можете использовать такой css:

```css
.dv-tag-в-процессе {
background-color: rgba(var(--color-red-rgb), .2);
}

.dv-tag-завершено {
background-color: rgba(var(--color-green-rgb), .2);
}
```



# Dataview Interactive Views

https://github.com/user-attachments/assets/0855c051-33db-4808-ac86-1928d32c5353

## Description

This plugin is intended to be used in the Obsidian app with the Dataview plugin (also CustomJS plugin is required). With Dataview you can create tables and lists from the notes, but they are not editable. This plugin allows you to create dynamic interactive views with several additional options:

- you can filter your tables by properties with the help of the filtering buttons;
- you can use pagination to break your entries into separate pages;
- you can easily switch between table, cards ald list views;
- you can edit properties directly from the table, without opening the note;
- you can render properties as images, functional checkboxes and sliders;
- you can use different colors for different property values;
- you can refresh the view with the help of the special button;
- you can add the button to create new note from the view;
- you can do all this with the minimal touching of the code.

## Installation

Installation via BRAT.

## How to set up

1.  Install the Dataview plugin and turn on javascript in the plugin settings.
3. Скопируйте код ниже в заметку Obsidian:

````
```dataviewjs

// Select and filter pages as you normally do with dataviewjs

let pages = dv.pages()

// General view settings

const settings = {
	"id": "view-1",
    "entries on page": 10,
    "full width": true,
    "add new note button": true,
}

// Properties settings

const props = [
  {
    prop: "file.link", 
    name: "Name",
    filter: true,
    column: true
  },
  {
    prop: "tags",
    filter: true,
    column: true
  }
] 

await DIViews.renderView(settings, props, pages, dv)
```
````

6. Edit the code according to your needs (see below).

## How to edit

You can change the view by editing the "settings" object ant the "props" array.

### General settings

The "settings" object contains the general settings of the view. It can contain several optional parameters:

`"entries on page": <number>` — describes how many entries should be on one page. If you skip this option, there will be no pagination.

`"full width": true` — if you want the table to fill the full width of the page.

`add new note button": true` - if you want to add the button for new note creation. 

If you add new note button, you can also add parameters for the new note (they are also optional).

`new note name: <string>`

`new note folder: <string>`

`new note template: <string>`

You can also change the position of the cards images by adding:

`"cards image position": "horizontal"`

As a result your settings may look like this, for example: 

```js
const settings = {
"entries on page": 10,
"cards image position": "horizontal",
"full width": true,
"add new note button": true,
"new note name": "New book",
"new note folder": "Books",
"new note template": "Book template"
}
```

### Properties settings

The "props" array describes, what properties are shown in the view. Each property has its own object, containing several attributes. For example:

```
{
  prop: "Property name",
  filter: true,
  column: true
}
```
Here are some options you can add to the property object:

`prop: <string>` — the name of the property (required).

`filter: true` — adds filtering button for this property on the top.

`column: true` — adds the column for this property to the table.

`name: <string>` — if you want to use alternative name for this property in table header and button.

`icon: <string>` — if you want to add icon to the property name in in table header and button. Only built-in lucide icons are supported. For example, `icon: "send"`.

`image: true` — property will be rendered as image. For this it must contain either external url link or wikilink to the local image.

`width: <number>` — sets the width of the image.

`fuzzySearch: true` — allows fuzzy search in filtering modal.

`span: true` — wraps property values into span tags with unique class names. It allows to use css for adding different colors for different values.

`multiSelect: true` — allows selecting multiple values in filtering modal. Only works with the list properties.

`editButton: "select"` — allows to select only one of existing options in editing modal. Works with text of list properties.

`slice: [0, 2],` — only show the first two symbols of property value (useful for properties starting with emojis).

`textHeight: <number>` — sets max height of the text property in table.

`alignBottom: true` — in the cards view push this property and all properties after to the bottom of the card.

`hideOnMobile: true` — don't show this property in the table on mobile.

`hideInCardsView: true` — don't show this property in cards view.

`ignoreFilter: true` — Do not filter notes by this property. However, you can still set a filter button that will change the values in the frontmatter, but they will not affect the display. This can be useful if you want to write your own custom filters.

Besides normal properties you can also use some file properties, like "file.link" or "file.path". Note that most of them are not editable for now, except for the note name. You can only access the first level file properties. 

You can use `file.tasks` property to get the list of file tasks with active checkboxes, and the filter button will allow you to switch between seing all tasks, just completed or just not completed. But the tasks support is very minimal for now and can be a little buggy.

There are additional two things you can put to the "props" array, that are not the properties. There are task progress and properties slider.

Task progress allow you to see the progress bar of all the tasks in the note. It is described like this:

```
{
    prop: "taskProgress",
    column: true  
}
```

Slider allows you to edit properties by dragging slider bar. It can be useful, for example, to track, how many chapters of a book you read etc. It described like this:

```
  {
    prop: "slider",
    column: true,
    propVal: "Value",
    propMax: "Max"
}
```
Slider requires two properties: maximal value and current value. If max value do not exist in the note, you can set it up by clicking on the slider cell. Double clicking on the slider allow you to change the value as a number.


## Additional styles

Using this script adds some additional properties to the note with the view. They are needed to store information about filters and other selected options. If you want to, you can hide these properties by adding css-snippet:

```css
  /* Hide interactive table properties */
  
  .metadata-property[data-property-key*="filter"],
  .metadata-property[data-property-key="view"],
  .metadata-property[data-property-key="pagination"],
  .metadata-property[data-property-key="search"],
  .metadata-property[data-property-key="show_search"],
  .metadata-property[data-property-key="sort"],
  .metadata-property[data-property-key="sort_direction"] {
      display: none;
  }
```

You can also use css to change colors of specific property values. To do this you must add the `span: true` option to the property object. Then you need to create the css snippet. For example, you have the property "Status" with the possible values "in progress" and "completed" and you want "in progress" to be red and "completed" to be green. You can use the css like this:

```css
.dv-tag-in-progress {
    background-color: rgba(var(--color-red-rgb), .2);
}

.dv-tag-completed {
    background-color: rgba(var(--color-green-rgb), .2);
}
```

Note, that all spaces must be replaced by dashes.
