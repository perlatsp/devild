/**
 * Searches and replaces given string in the given content
 * @original author dword-design
 * @url https://www.npmjs.com/package/mysqldump-search-replace
 * @param {long} dump file contents
 * @param {string} search url to search
 * @param {string} replace url to replace
 */
const replace = function (dump, search, replace){
    return dump.replace(new RegExp(search, 'g'), replace)
      .replace(/s:([1-9]\d*):\\"(.*?)\\";/g, (match, length, value) => {
        var unescapedValue = value.replace(/(?<!\\)\\(?!\\)/g, '').replace(/\\\\/g, '\\');
        var escapedLength = Buffer.byteLength(unescapedValue, 'utf-8');
        return `s:${escapedLength}:\"${value}\";`
      });
  }
  module.exports = replace;