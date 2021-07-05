let db;
let budgetV;

const request = indexedDB.open('BudgetDB', budgetV || 21);

request.onupgradeneeded = function (e) {
  const { oldVersion } = e;
  const newV = e.newV || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newV}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetTracker', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Error! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log('check db invoked');

  let transaction = db.transaction(['BudgetTracker'], 'readwrite');

  const store = transaction.objectStore('BudgetTracker');

  const getAll = store.getAll();


  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(['BudgetTracker'], 'readwrite');
            const currentTransaction = transaction.objectStore('BudgetTracker');
            currentTransaction.clear();
            console.log('Clearing tracker');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  if (navigator.onLine) {
    console.log('Backend online!');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save invoked');
  const transaction = db.transaction(['BudgetTracker'], 'readwrite');

  const store = transaction.objectStore('BudgetTracker');

  store.add(record);
};

window.addEventListener('online', checkDatabase);