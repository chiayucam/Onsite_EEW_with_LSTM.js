const queryString = window.location.search;

const urlParams = new URLSearchParams(queryString);

const page_type = urlParams.get('record')

console.log(page_type);c