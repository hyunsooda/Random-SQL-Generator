const fs = require('fs');
const util = require('./util.js');
const webpack = require('webpack');
const beautify = require('js-beautify').js;
let filename;

function readSql(file, extracJSON = false) {
    let query = fs.readFileSync(file, 'utf-8');
    let result = {};
    let dataTypes = ['int', 'tinyint', 'smallint', 'mediumint', 'bigint', 'float', 'double', 'decimal',
                     'date', 'datetime', 'timestamp', 'year', 'varchar', 'char', 'blob', 'text', 'tinyblob', 'tinytext',
                    'mediumblob', 'mediumtext', 'longblob', 'longtext', 'enum'];
    let q, table;

    query = query.split('\n');
    
    for(let i=0; i<query.length; i++) {
        q = query[i].toLowerCase();
    
        if(q.indexOf('create') > -1) {
            table = q.substr(q.indexOf('table') + 5);
            table = table.substr(0, table.indexOf('(') - 1).trim();
            
            result[table] = {};
        } else {
            for(let j=0; j<dataTypes.length; j++) {
                if(q.indexOf(dataTypes[j]) > -1 && q.indexOf('alter') < 0) {
                    if(q.indexOf('char') > -1 && q.indexOf('var') > -1 && dataTypes[j] === 'char') continue;
                    if(q.indexOf('date') > -1 && q.indexOf('time') > -1 && dataTypes[j] === 'date') continue;

                    let name = q.substr(0, q.indexOf(dataTypes[j]) - 1).trim();
                    let type = !extracJSON ? dataTypes[j] : q.replace(",", '');
                    result[table][name] = type;
                }   
            }
        }
            
    }

    return result;
}




// support : int, varchar, char, datetime
function genInsert(tableName, attributes) {
    let command = `insert into ${tableName} values(`;

    for(let p in attributes) {
        switch(attributes[p]) {
            case 'varchar' || 'char': command += '"' + util.makeid() + '"'
            break;
            case 'int': command += Number(util.genNumber());
            break;
            case 'datetime': command += '"' + util.randomDate(new Date(1970, 0, 1), new Date()).format('yyyy-MM-dd') + '"';
            break;
        }
        command += ',';
    }
    command = command.substring(0,command.length-1);
    command += ');';
    return command;
}

function generate() {
    let sql = readSql(filename);
    let str = '';

    for(let p in sql) {
        for(let i=0; i<3; i++)
            str += genInsert(p, sql[p]) + '\n';
    }  
    
    fs.writeFileSync(`gen_${filename.substr(0,filename.indexOf('.'))}.sql`, str);
}
function toJSON() {
    let sql = readSql(filename, true);
    
    fs.writeFileSync(`gen_${filename.substr(0,filename.indexOf('.'))}.json`, beautify(JSON.stringify(sql),{
        indent_size: 4, 
        space_in_empty_paren: true
    }));
}
function notice(path) {
    filename = path;
}
module.exports = {
    notice,
    toJSON,
    generate
}






    