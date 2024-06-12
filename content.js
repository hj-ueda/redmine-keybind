// 対応記録資料ファイル名用
// --done コミットコメント用prefix
// チケットURL
// --done チケット番号のみ
// --done タイトルのみ
// github上のブランチへ移動リンク
// backlog運用番号
// フルタイトル?
// slackコードブロック用、URLとチケットタイトル

document.addEventListener('DOMContentLoaded', () => {
  const buttonData = {};
  
  const ticketNum = getTicketNum();
  const ticketTitle = getTicketTitle();
  const url = location.href
  console.log('ticketTitle', ticketTitle)
  
  // チケット番号
  if(ticketNum) {
    buttonData.ticketNum = {
      text: ticketNum,
      content: ticketNum,
      keyCode: 'j'
    };
  }
  
  // チケットタイトル
  if(ticketTitle) {
    buttonData.ticketTitle = {
      text: ticketTitle, 
      content: ticketTitle, 
      keyCode: 't'
    };
  }
  
  // コミットコメント用プレフィックス
  if(ticketNum && ticketTitle) {
    const commitCommentPrefix = `redmine#${ticketNum} ${ticketTitle}`;
    buttonData.commitCommentPrefix = {
      text: commitCommentPrefix, 
      content: commitCommentPrefix, 
      keyCode: 'c'
    };
  }
  
  // チケットURL
  if(url !== undefined) {
    buttonData.url = {
      text: 'url', 
      content: () => location.href, 
      keyCode: 'l'
    };
  }
  
  // doc用ファイル名
  if(ticketTitle !== undefined && ticketNum !== undefined) {
    buttonData.docFileTitle = {
      text: 'doc file title', 
      content: `${ticketNum}-${ticketTitle.replace()}.md`, 
      keyCode: 'k'
    };
  }
  
  document.querySelector("#content > div.issue.tracker-1.status-2.priority-2.priority-default.assigned-to-me.details > div.subject > div > h3")
  
  insertButtons(buttonData);
  
  setKeyEvent();
})

function getTicketNum() {
  const h2El = document.querySelector('#content > h2')
  if(!h2El) return null;
  
  const ptn = /.+#([0-9]+)/
  console.log('h2El.innerText', h2El.innerText) 
  
  const result = h2El.innerText.match(ptn);
  let num;
  if(result !== null && result.length) {
    num = result[1];
    return num;
  } else {
    return null;
  }
}

/**
 * @returns string | null
 */
function getTicketTitle() {
  const fullTitleEl = document.querySelector('.issue h3')
  if(fullTitleEl == null) return null
  
  // ":"が無い場合がうまくいかない
  const ptn = /^(.*[:：]){0,1}(.+)/
  
  ''.match(ptn)
  
  /** @var RegExpMatchArray | null */
  const result = fullTitleEl.innerText.match(ptn)
  let title;
  if(result !== null && result.length) {
    title = result[2];
    return title;
  } else {
    return null;
  }
}

const keyEventList = {};
function insertButtons(buttonData) {
  /** @type HTMLHeadingElement */
  const actionArea = document.querySelector('#content h2');
  actionArea.classList.add('action_area')
  
  for(let key in buttonData) {
    const text = buttonData[key].text;
    const content = buttonData[key].content;
    const keyCode = buttonData[key].keyCode;
    const buttonEl = buttonFormat(text, keyCode, async (e) => {
      try {
        await copyToClipboard(e, content)
        notify(text, true);
      } catch(e) {
        console.log('[redmine-keybind extension] ', e);
        notify(text, false);
      }
    })
    keyEventList[keyCode] = () => {buttonEl.click()}
    
    console.log('buttonEl', buttonEl)
    actionArea.appendChild(buttonEl)
  }
}


function unsecuredCopyToClipboard (e, text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  e.target.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try{
    document.execCommand('copy')
  } catch(err) {
    console.error('Unable to copy to clipboard', err)
  }
  e.target.removeChild(textArea)
};

/**
 * @param {ClickEvent} e 
 * @param {string | function} content 
 */
async function copyToClipboard (e, content) {
  if(typeof content === 'function') {
    content = content()
  }

  if (window.isSecureContext && navigator.clipboard) {
    await navigator.clipboard.writeText(content);
  } else {
    console.log('e', e)
    await unsecuredCopyToClipboard(e, content);
    // alert("ページ内で、httpによる安全でない通信があるためクリップボードへのアクセスが拒否されました。")
  }
};


/**
 * 
 * @param {string} text 
 * @param {*} key 
 * @param {*} onClick 
 * @returns HTMLDivElement
 */
function buttonFormat(text, key, onClick) {
  const parent = document.createElement('div')
  parent.classList.add('keybind_parent')
  // parent.style.cssText = ' \
  //   display: inline-block; \
  //   vertical-align: top; \
  // ';
  
  // button element
  const button = document.createElement('button');
  button.innerText = text;
  button.classList.add('keybind_button')
  // button.style.cssText = ' \
  //   background: #c9c9c9; \
  //   border: none; \
  //   border-bottom: 4px gray solid; \
  //   padding: 4px 8px; \
  //   border-radius: 5px; \
  //   cursor: pointer; \
  //   margin-left: 10px; \
  // ';
  
  // key code
  const span = document.createElement('span')
  span.innerText = `(${key})`
  span.classList.add('keybind_keycode')
  // span.style.cssText = ' \
  //   text-decoration: underline; \
  //   margin-left: 4px; \
  //   color: #bd1f1f; \
  // ';
  
  button.appendChild(span)
  
  parent.appendChild(button);
  
  parent.addEventListener('click', onClick)
  return parent;
}



function setKeyEvent() {
  document.addEventListener('keydown', (e) => {
    for(let keyCode in keyEventList) {
      if(e.key === keyCode && e.altKey) {
        keyEventList[keyCode]()
        break;
      }
    }
  })
}

function notify(text, success) {
  const notification = document.createElement('div');
  if(success) {
    notification.innerText = `${text} copied!`;
  } else {
    notification.innerText = `error occured`;
    notification.classList.add('keybind_error')
  }
  
  notification.classList.add('keybind_notification')
  notification.addEventListener('animationend', () => {
    notification.remove()
  })
  
  document.body.appendChild(notification)
  
}