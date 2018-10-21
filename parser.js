const fs = require('fs');
const util = require('./util.js');
const beautify = require('js-beautify').js;
let filename, iteration;

function readSql(extracJSON = false) {
    let query = fs.readFileSync(filename, 'utf-8');
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
function assembleInsertOrder() {
    let query = fs.readFileSync(filename, 'utf-8');
    let sql = readSql();
    let q, table, arr2 = [], arr1 = [];
    let flag = true;
    let temp = [];

    query = query.split('\n');
    
    for(let i=0; i<query.length; i++) {
        q = query[i].toLowerCase();
    
        if(q.indexOf('alter') > -1) {
            table = q.substr(q.indexOf('references') + 10);
            table = table.substr(0, table.indexOf('(')).trim();
            arr2.push(table);
        }   
    }
    arr2 = arr2.reduce((prev, cur, idx) => {
        if(prev.indexOf(cur) < 0) 
            prev.push(cur);
        return prev;
    }, []);

    for(let p in sql) 
        arr1.push(p);

    for(let i=0; i<arr1.length; i++) {
        for(let j=0; j<arr2.length; j++) {
            if(arr2[j] === arr1[i]) {
                flag = false;
                break;
            }
        }
        if(flag) 
            temp.push(arr1[i])
        flag = true;
    }
    
    return arr2.concat(temp);
}




// support : int, varchar, char, datetime
function genInsert(tableName, attributes, result, relation) {
    let command = `insert into ${tableName} values(`;
    let temp;
    
    if(!result[tableName]) result[tableName] = {};

    for(let p in attributes) {
        if(!result[tableName][p]) result[tableName][p] = [];
        switch(attributes[p]) {
            case 'varchar' || 'char': 
                temp = util.makeid();
                
                if(relation.hasOwnProperty(tableName)) {
                    let fk = relation[tableName]['foreignkey'];
                    let idx = fk.indexOf(p);
                    if(idx !== -1) {
                        let ref_table = relation[tableName]['referenceTable'][idx];
                        let ref_key = relation[tableName]['referenceKey'][idx];

                        let k =result[ref_table][ref_key];

                        temp = k[Math.floor(Math.random() * k.length)];
                    }
                }
                command += '"' + temp + '"';
                result[tableName][p].push(temp);
            break;
            case 'int': 
                temp = Number(util.genNumber());
                
                if(relation.hasOwnProperty(tableName)) {
                    let fk = relation[tableName]['foreignkey'];
                    let idx = fk.indexOf(p);
                    if(idx !== -1) {
                        let ref_table = relation[tableName]['referenceTable'][idx];
                        let ref_key = relation[tableName]['referenceKey'][idx];

                        let k =result[ref_table][ref_key];

                        temp = k[Math.floor(Math.random() * k.length)];
                    }
                }
                command += temp;
                result[tableName][p].push(temp);
            break;
            case 'datetime': 
                temp = util.randomDate(new Date(1970, 0, 1), new Date()).format('yyyy-MM-dd');

                if(relation.hasOwnProperty(tableName)) {
                    let fk = relation[tableName]['foreignkey'];
                    let idx = fk.indexOf(p);
                    if(idx !== -1) {
                        let ref_table = relation[tableName]['referenceTable'][idx];
                        let ref_key = relation[tableName]['referenceKey'][idx];

                        let k =result[ref_table][ref_key];

                        temp = k[Math.floor(Math.random() * k.length)];
                    }
                }
                command += '"' + temp + '"';
                result[tableName][p].push(temp);
            break;
        }
        command += ',';
    }
    command = command.substring(0,command.length-1);
    command += ');';
    return command;
}

function generate(isFileWrite = true) {
    let sql = readSql();
    let order = assembleInsertOrder();
    let relation = getRelation();
    let str = '';
    let i = 0;
    let result = {};
    
    // insert를 위한 데이터 생성
    while(i < order.length) {
        for(let p in sql) {
            if(order[i] === p) {
                for(let j=0; j<iteration; j++) 
                    str += genInsert(p, sql[p], result, relation) + '\n';
                break;
            }
        }
        i++;
    }
    // insert구문 생성
    if(isFileWrite) {
        util.genClear();
        fs.writeFileSync(`gen_${filename.substr(0,filename.indexOf('.'))}.sql`, str);
    }

    return result;
}


function getRelation() {
    let query = fs.readFileSync(filename, 'utf-8');
    let result = {};
    let referencingTable, referencingForeignkey, referencedTable, referencedForeignkey;

    query = query.split('\n');
    
    for(let i=0; i<query.length; i++) {
        q = query[i].toLowerCase();
    
        if(q.indexOf('alter') > -1) {
            referencingTable = q.substr(q.indexOf('table') + 5).trim();
            referencingTable = referencingTable.substr(0, referencingTable.indexOf('add')).trim();

            referencingForeignkey = q.substr(q.indexOf('foreign key') + 11).trim();
            referencingForeignkey = referencingForeignkey.substr(referencingForeignkey.indexOf('(') + 1).trim();
            referencingForeignkey = referencingForeignkey.substr(0, referencingForeignkey.indexOf(')')).trim();

            referencedTable = q.substr(q.indexOf('references') + 10 + 1).trim();
            referencedTable = referencedTable.substr(0, referencedTable.indexOf('(')).trim();

            referencedForeignkey = q.substr(q.indexOf('references') + 10 + 1).trim();
            referencedForeignkey = referencedForeignkey.substr(referencedForeignkey.indexOf('(') + 1);
            referencedForeignkey = referencedForeignkey.substr(0, referencedForeignkey.indexOf(')'));
    
            if(!result[referencingTable]) {
                result[referencingTable] = {};
                result[referencingTable]['foreignkey'] = [];
                result[referencingTable]['referenceTable'] = [];
                result[referencingTable]['referenceKey'] = [];
            }

            result[referencingTable]['foreignkey'].push(referencingForeignkey);
            result[referencingTable]['referenceTable'].push(referencedTable);
            result[referencingTable]['referenceKey'].push(referencedForeignkey);
        }  
    }
    return result;
}

function toJSON() {
    let sql = generate(false);

    fs.writeFileSync(`gen_${filename.substr(0,filename.indexOf('.'))}.json`, beautify(JSON.stringify(sql),{
        indent_size: 4, 
        space_in_empty_paren: true
    }));
}
function notice(path, num) {
    filename = path;
    iteration =  num;
}


module.exports = {
    notice,
    toJSON,
    generate
}





 



    