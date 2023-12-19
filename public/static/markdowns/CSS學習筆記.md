# CSS 學習筆記

<!-- TOC -->

- [CSS 學習筆記](#css-學習筆記)
  - [後裔選擇器](#後裔選擇器)
    - [基本類型](#基本類型)
    - [複合型](#複合型)
  - [屬性選擇器`[]`](#屬性選擇器)
  - [表格](#表格)
  - [偽元素](#偽元素)
  - [`display:none`和`visibility:hidden`的差別](#displaynone和visibilityhidden的差別)
  - [Display](#display)
    - [Display Outside](#display-outside)
      - [Block 區塊元素](#block-區塊元素)
      - [Inline 行內元素](#inline-行內元素)
    - [Display Inside](#display-inside)
      - [Table](#table)
      - [Flex](#flex)
        - [Flex-direction 方向性](#flex-direction-方向性)
        - [justify-content 調整內容](#justify-content-調整內容)
        - [align-items 對齊物件](#align-items-對齊物件)
        - [align-self 自身對齊](#align-self-自身對齊)
      - [Wrap 斷行](#wrap-斷行)
    - [Global 全域屬性](#global-全域屬性)
      - [inherit 跟隨父層屬性](#inherit-跟隨父層屬性)
      - [initial 變回原本屬性](#initial-變回原本屬性)
    - [Display-Box 影響用箱子裝起來的所有元素](#display-box-影響用箱子裝起來的所有元素)
      - [none](#none)
    - [Display-Legacy 此屬性繼承兩者的特性](#display-legacy-此屬性繼承兩者的特性)
      - [inline-block](#inline-block)
      - [inline-table](#inline-table)
      - [inline-flex](#inline-flex)
  - [HTML 佈局](#html-佈局)
    - [盒子模型](#盒子模型)
    - [Position](#position)
      - [Static](#static)
      - [Relative](#relative)
      - [Absolute](#absolute)
      - [Fixed](#fixed)
      - [sticky](#sticky)
    - [float](#float)
    - [float 和 position 的兼容問題](#float-和-position-的兼容問題)
  - [CSS 簡易暗黑模式](#css-簡易暗黑模式)
  - [變數宣告](#變數宣告)
  - [RWD 範例](#rwd-範例)

<!-- /TOC -->

> 將所有物件加上外框
>
> ```css
> * {
>   outline: 1px solid #000;
> }
> ```

## 後裔選擇器

### 基本類型

- 標籤 `#id` `.class`

- div 標籤和 span 標籤

  ```css
  div,
  span {
  }
  ```

### 複合型

- div 標籤底下，為 span 標籤

  ```css
  div > span {
  }
  ```

- div 標籤內所有的 span 標籤

  ```css
  div span {
  }
  ```

- div 標籤之後的第一個 span 標籤

  ```css
  div + span {
  }
  ```

- div 標籤之後的所有 span 標籤

  ```css
  div ~ span {
  }
  ```

## 屬性選擇器`[]`

可直接查找任何屬性內元素(ex:`class`, `div`, `title`, `href`,....)，亦可使用於直接指定屬性

- `|` 符號為屬性，包含`[foo]`且必在開頭，須為獨立字元、特定單詞，以及字元後加上連接符號 `-`

  ```css
  p[class|="red"] {
  }
  ```

- `~` 符號為屬性只要有包含`[foo]`，無順序問題，需為獨立字元、特定單詞

  ```css
  a[herf~="apple"] {
  }
  ```

- `^` 符號為屬性使用`[foo]`開頭，不特定獨立字元

  ```css
  a[herf^="http"] {
  }
  ```

- `$` 符號為屬性使用`[foo]`結尾，不特定獨立字元

  ```css
  a[herf$="selectors.asp"] {
  }
  ```

- `*` 符號為屬性內含有`[foo]`，不特定獨立字元

  ```css
  a[herf*="pseudo"] {
  }
  ```

## 表格

- 將標籤做成表格

  ```css
  .class {
    display: grid;
  }
  ```

## 偽元素

- 在原本的元素「之前」加入內容

  ```css
  ::before ;
  ```

- 在原本的元素「之後」加入內容

  ```css
  ::after ;
  ```

- 兩者都是以 display: inline-block;屬性存在
- 偽元素會「繼承」原本元素的屬性
- 偽元素一定要加上 content 的屬性，沒有 content 偽元素不會出現在畫面上

## `display:none`和`visibility:hidden`的差別

當使用 `visibility:hidden` 時，物件是確實的被隱藏的，但依然保有物件的位置

例如：當表格內的標籤加上 `visibility:hidden` 時，其儲存格中的值會被隱藏，但儲存格不會消失

當使用 `display:none` 時，物件及其原本的位置都會被隱藏

## Display

### Display Outside

#### Block 區塊元素

- 總是以新的一行開始，所以無論設定多少寬度，他基本容器的寬度，還是會撐滿整個空間。
- 即使容器中的元素已經被調整成 50%，但他還是會將後面的元素排擠在下面。

#### Inline 行內元素

- 又稱線內元素，元素本身高度多少他就是多少，無法調整寬高，此外他可以設定 padding 的上下左右，而 margin 只能設定他的左右。
- inline 屬性預設元素的排列為由左到右，直到裝滿容器。

### Display Inside

#### Table

- 可以將元素直接模擬成 table 來使用。

  - Table-Row 對應 `<tr>`
  - Table-Row-Group 對應 `<tbody>`
  - Table-Cell `<td>`
  - Table-caption `<caption`
  - Table-Column `<col>`
  - Table-Column-Group `<colgroup>`
  - Table-Header-Group `<thead>`
  - Table-Footer-Group `<footer>`

#### Flex

- 設定 flex 屬性之前，需先設定父層容器 display: flex

##### Flex-direction 方向性

- 水平方向(瀏覽器預設)：row, row-reverse(水平方向反轉)
- 垂直方向：column, column-reverse(垂直方向反轉)

##### justify-content 調整內容

- 改變 flex 物件在主軸上的對齊(預設為水平方向)，若 flex-direction 為 column，則對齊方向改為垂直方向(y 軸)
  - justify-content: flex-start 以起點為基準
  - justify-content: flex-end 以尾端為基準
  - justify-content: center 以中間為基準
  - justify-content: space-between 會將物件依容器大小均分
  - justify-content: space-around 會將物件依容器大小均分，並會給左右空間

##### align-items 對齊物件

- 改變橫軸上所有 flex 物件的對齊(預設為垂直方向)，若 flex-direction 為 column，則對其方向會改為水平方向(x 軸)
  - align-items: flex-start 以起點為基準
  - align-items: flex-end 以尾端為基準
  - align-items: center 以中間為基準
  - align-items: baseline 以物件基準線為基準
  - align-items: stretch 以起點為基準，但會撐滿容器(瀏覽器預設)

##### align-self 自身對齊

- 單獨改變物件在橫軸上的對齊(預設為垂直方向)，若 flex-direction 為 column，則對齊方向則改為水平方向(x 軸)
  - align-self: flex-start 以起點為基準
  - align-self: flex-end 以尾端為基準
  - align-self: center 以中間為基準
  - align-self: baseline 以物件基準線為基準
  - align-self: stretch 以起點為基準，但會撐滿容器(瀏覽器預設)

#### Wrap 斷行

- Flex-Nowrap：強制不斷行。
- Flex-Wrap：裝滿容器會強制斷行。
- Flex-Wrap-Reverse：裝滿容器會強制斷行，但排列順序是相反的。

### Global 全域屬性

- 除了 display 以外，齊他任意屬性都能使用

#### inherit 跟隨父層屬性

- 當父層屬性為 block，子層下 Display:Inherit 時，子層屬性也會變成 block

#### initial 變回原本屬性

- 假如我 div 屬性在某種情況下更改為 inline 屬性，那我後面有吃到同樣 CSS 的 div 想改回 Block，我只要下 Display:Initial，就會變回 Div 原本的 Block 屬性

### Display-Box 影響用箱子裝起來的所有元素

#### none

- 若被 display: none; 的 div 裝起來的元素，會被隱藏。

### Display-Legacy 此屬性繼承兩者的特性

#### inline-block

- 讓許多區塊自動浮起來水平排列，且不用額外設定 clear 也不會讓接著的元素浮上來蓋住區塊

#### inline-table

#### inline-flex

- flex 時父元素為 block，而 inline-flex 則是父元素變成 inline，他會根據子元素所有的 div 大小自適應寬度和高度

## HTML 佈局

### 盒子模型

在 HTML 中元素的盒子模型分為兩種，塊狀元素(block)和行內元素(inline)。其兩種元素和 display 屬性中的 inline block 兩個屬性不盡相同。

盒子模型中的 inline, block 類似於 display 屬性的父類，如：display 屬性中的 list-item 屬性質是屬於塊狀(block)類型。

塊狀(block)和行內(inline)的區別:

- block 可以設置 width, height 屬性。inline 設置無效。
- block 類型的元素會獨佔一行，而 inline 會在同一行內顯示
- block 元素的 width 預設為 100%，而 inline 則是根據自身的 內容及子元素來決定寬度。

下面是一些常見的元素分類

- block: p, div, ul, il, dd, dt......
- inline: a, img, span, strong

### Position

> 設定物件定位時所要的參考對象

- 目前可以用的
  - static 靜態的
  - relative 相對定位
  - fixed 固定定位
  - absolute 絕對定位
  - sticky 黏貼定位

#### Static

靜態定位，將其他定位特性取消，回到最原始的狀態，為一般網頁最原始的預設值。

#### Relative

相對定位，將設定的物件其參考空間，設定為自身原始的資料流位置，且此種定位值並不會將物件獨立一層，搭配其他 css 屬性如：`top`, `bottom`, `left`, `right`可以做到顯示位置的偏移。

#### Absolute

絕對定位，將設定的物件，其參考空間設定為「階層離自身最近，且具備定位設定的父層空間」，若沒有任何父層空間具備定位設定，該物件將採用視窗空間座位參考空間，而父層只要具備以下四種定位類型之一，即可被絕對定位當作參考空間：

- relative
- absolute
- fixed
- sticky

此外當物件設定了 abstract 後，將會自己獨立一層，不在其他物件關連，可以利用此一特性，進行物件堆疊的視覺效果。

#### Fixed

固定定位，將設定的物件，將其參考空間設定為視窗，因此無論如何捲動視窗捲軸，這個物件都會固定在原位。固定定位和絕對定位一樣，都會自己獨立一層。

#### sticky

黏貼定位，結合 relative 和 fixed 兩大特性

1. 預設定位在父層空間
2. 當視窗捲動到該物件時，會依據對該物件設定的 top 值來讓該物件呈現 fixed 在視窗中的效果。
3. 當物件呈現 fixed 的效果時，其所能 fixed 的空間是該物件的父層空間。
4. 當視窗向下捲動超過 sticky 物件的父層空間時，該物件不會再呈現 fixed 效果，而是被捲離視窗範圍。

### float

float 的屬性只有 none, left, right。

1. 只有橫向浮動，沒有縱向浮動
2. 當元素應用了 float 時將會脫離一般資料流，其容器元素將得不到脫離原始資料流的子元素高度
3. 一個元素會圍繞著浮動元素(文繞圖)，與應用了 position 的元素相比，浮動元素並不會遮蓋後一個元素。
4. 浮動元素前一個元素不會受到任何影響，若想將兩塊狀元素並排顯示，則需將兩個塊狀元素都應用 float。
5. 會將元素的 display 屬性更變為 block

### float 和 position 的兼容問題

元素若同時應用 position: relative, float, (top, bottom, right and left) 屬性時，則元素會先浮動到相對應位置，再根據 (top, bottom, right and left)設置的距離來發生偏移。

若不將 float 元素的 position 設置為 relative，此時若要設置 float 的 z-index 來實現覆蓋 position: absolute 會無效。

同理可證，float 元素若下面存在 position: absolute 的子元素，若不將 float 元素的 position 設為 relative，absolute 元素是無法定位到 float 元素的。

## CSS 簡易暗黑模式

```css
@media (prefers-color-scheme: dark) {
  html {
    filter: invert(90%) hue-rotate(180deg);
  }

  img,
  video,
  svg,
  code[class*="language-"] {
    filter: invert(110%) hue-rotate(180deg);
    opacity: 0.8;
  }

  img {
    background: #fff;
  }
}
```

- `invert` 將所有色值反轉，hue-rotate 將黑白以外的其他主題色調再反轉過來(防止頁面主題色出現過大變化)
- `code[class*="language-"]` 為 markdown 語法中的程式碼區塊
- 若 html 反轉 90% 則圖片等元素需反轉 110%
- 去背圖片在黑暗模式中因為背景變成黑底色，可能就會造成深色內容被深色背景吃掉的問題，為了避免這個問題，建議 img 的背景一律調成跟正常模式的背景色

## 變數宣告

- 定義變數：必需要定義在 css 選取器中，建議定義在 `:root` 最高層及的選取器以便於使用，使用 `--自訂名稱` 作為屬性的方式來宣告變數
- 取用變數值：`var(變數名稱)`

```css
:root {
  --dangerous-color: red;
}

.table {
  background-color: var(--dangerous-color);
}
```

## RWD 範例

```css
/***----- media -----***/
/*** media max1024 ***/

@media (max-width: 1024px) {
}

/*** screen and media max800 ***/

@media screen and (max-width: 800px) {
}

/*** media max800 ***/

@media (max-width: 800px) {
}

/*** media max768 ***/

@media (max-width: 768px) {
}

/*** media min768 ***/
@media (min-width: 768px) {
}

/*** media max640 ***/

@media (max-width: 640px) {
}

/*** media max480 ***/

@media (max-width: 480px) {
}

/*** media max320 ***/

@media (max-width: 320px) {
}
```
