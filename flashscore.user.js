// ==UserScript==
// @name         FlashScore
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       You
// @grant        GM_registerMenuCommand
// @run-at       context-menu
// @match        https://www.flashscore.com/*
// @require      file://M:\dev\_job\fl\flashscore\file.js
// ==/UserScript==

async function start() {
  const master = {
    email: 'megapopov@yandex.ru',
    password: '25128170',
  };
  
  const slaves = window.__fs_data
    .trim()
    .split(/[\r\n]+/)
    .map(line => {
      let [email, password] = line.trim().split(/\s+/);
      return {email, password};
    });
  
debugger;

  window.confirm = unsafeWindow.confirm = () => true;
  
  function delay(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
  }
  
  function waitFor(condition, timeout = 10000) {
    let startTime = Date.now();
  
    return new Promise((resolve, reject) => {
      let check = () => {
        let result = condition();
          if (!result) {
            if (Date.now() <= startTime + timeout) {
              setTimeout(check, 100);
            } else {
              debugger;
              reject('timeout');
            }
          } else {
            resolve(result);
          }
      };
  
      check();
    });
  }
  
  function $$(selector, timeout = 10000) {
    return waitFor(() => document.querySelector(selector), timeout)
  }
  
  function addToMyGamesFetch(gameId) {
    return fetch(`https://remote-stats.flashscore.com/mg?callback=jsonp_cb&sport_id=1&project_id=2&tournament_stage_id=OxWJIutM&event_id=${gameId}&_=1606302297165`)
      .then((res) => {
        jsonp_cb("ok");
        return res;
      });
  }
  
  async function getMyGames() {
    await $$('.event.event--myGames .event__match');
    let games = document.querySelectorAll('.event.event--myGames .event__match');
    let result = [];
    for (let game of games) {
      let id = game.id;
      let m = id.match(/^\w_\w_(.+?)$/);
  
      if (!m) {
        debugger;
        continue;
      }
  
      let [, gameId] = m;
      result.push(gameId);
    }
  
    return result;
  }
  
  async function clickOnMyGames() {
    // Click on My Games
    let tab = await $$('#live-table .tabs__group .tabs__tab:nth-child(3)');
    tab.click();
  }
  
  async function clickOnAllGames() {
    // Click on My Games
    let tab = await $$('#live-table .tabs__group .tabs__tab:nth-child(1)');
    tab.click();
  }
  
  async function logout() {
    let logoutBtn = await $$('#lsid-sign-out');
    logoutBtn.click();
  
    await delay(500);
    await closeModal();
  }
  
  async function isLoggedIn() {
    let lsid = await $$('#lsid');
    return !!lsid.querySelector('#lsid-dropdown');
  }
  
  async function loggedAs() {
    let lsid = await $$('#lsid');
    return lsid.querySelector('#lsid-dropdown span.email').innerText;
  }
  
  async function login(email, password) {
    let logoutBtn = await $$('#signIn');
    logoutBtn.click();
    await delay(1000);
    let loginForm = await $$('#lsid-window[data-window-name="login"]');
    let emailInput = await $$('#email');
    let passwdInput = await $$('#passwd');
    let loginBtn = await $$('#login');
  
    await delay(500);
    emailInput.value = email;
    passwdInput.value = password;
  
    await delay(500);
    loginBtn.click();
  
    await $$('#lsid-window #lsid-window-close');
  }
  
  async function closeModal() {
    let closeBtn = await $$('#lsid-window #lsid-window-close');
    closeBtn.click();
    await delay(1000);
  }
  
  let myGames = [];

  await delay(2000);

  if (await isLoggedIn()) {
    await logout();
  }

  // Master - collect data
  {
    await login(master.email, master.password);
    await closeModal();
    await delay(2000);  
    await clickOnMyGames();
    myGames = await getMyGames();
    await delay(2000);
    await logout();
  }

  // Slaves - put data
  for (let slave of slaves) {
    await login(slave.email, slave.password);
    await closeModal();
    await delay(3000);
    await clickOnAllGames();
  
    let games = [...document.querySelectorAll('.leagues--live .event__match')].filter((game) => {
      for (let myGame of myGames) {
        if (game.id.endsWith(myGame)) {
          return true;
        }
      }
  
      return false;
    });
  
    await delay(1000);
    for (let game of games) {
      let check = game.querySelector('.event__check:not(.checked)');
      if (!check) {
        continue;
      }
      check.click();
      await delay(500);
    }
  }
}

start();

// GM_registerMenuCommand ("Запуск", start);
