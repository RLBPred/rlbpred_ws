//<pre id="fileContent"></pre>
document.addEventListener('DOMContentLoaded', function () {
    fetch('output1.json')
        .then(response => response.json())
        .then(data => {
            //document.getElementsByClassName('boxTable')[0].remove()
            //document.getElementById('fileContent').textContent = data;
            //var urlParams = new URLSearchParams(window.location.search);
            //var accession = urlParams.get('accession');
            // 使用 URLSearchParams 获取查询字符串中的参数
            const params = new URLSearchParams(window.location.search);

            // 获取特定的参数值
            const accession = params.get('accession');
            const exactSearchType = params.get('exact_search_type');

            // 如果accession参数存在，则打印到页面上
            if (accession) {
                document.getElementById('accessionValue').innerHTML = `The protein you are searching for is: ${accession}`;
            } else {
                document.getElementById('accessionValue').innerHTML = 'Accession parameter not provided.';
            }
            if (accession) {
                // 使用正则表达式匹配以~~~开头和结尾，包含accession的段落
                var match = findMatchByAccession_json(data, accession, exactSearchType);
                if (match && match.length > 0 && match[0]) {
                    console.log(match)


                    // TODO 只显示了第一个元素的概率值，需要修改

                    // 清空表格
                    //document.getElementById('myTableContainer').innerHTML = '';

                    // 遍历匹配到的数组，生成并追加表格
                    //match.forEach((item) => {
                    //const htmlTable = generateHtmlTable_json(item);
                    //document.getElementById('myTableContainer').innerHTML += htmlTable;
                    //});
                    // 调用 displayMatches 来处理匹配数据的展示逻辑
                    displayMatches(match, exactSearchType);
                } else {
                    // 如果没有找到，给出提示信息
                    document.getElementById('searchContent').textContent = 'No information found for the given accession.';
                    // 未找到匹配段落的处理
                    document.getElementById("probabilityValue").textContent = "no result";
                    // document.getElementById('myTableContainer').innerHTML = "No matching data found.";
                }
            }


        })
        .catch(error => {
            console.error('Error fetching file:', error);
        });
});


function findSequence(data, target, topN) {//预处理+通过调用匹配的函数对返回值进行排序和封装
    var matches = [];
    for (var i = 0; i < data.length; i++) {//遍历data数组中的每个对象，以便逐一处理序列
        var text = data[i].item.seq.replace(/[\s\n]/g, '')//清除seq字段中的空白字符和换行符
        // console.log(text)
        var match = topNClosestMatches(target, text, target.length, 1);
        var closestMatch = match[0]//检查最接近的匹配
        if (closestMatch) {//如果找到了匹配，
            // console.log(m)
            closestMatch['idx'] = data[i].refIndex;
            matches.push(closestMatch);//将closesmatch添加到matches数组中
            // match[0].idx = i;
            // matches.push(match[0]);
            // matches[matches.length - 1].idx = i;
        }

    }
    // Sort matches by distance
    matches.sort((a, b) => a.distance - b.distance);//对 matches 数组按匹配的距离（distance 属性）从小到大进行排序。距离越小表示匹配度越高。
    console.log(matches)

    // Return top N closest matches
    return matches.slice(0, topN);
}

function topNClosestMatches(target, text, maxLength, topN) {
    let matches = [];

    // Slide over the string and compare every possible substring of maxLength
    for (let i = 0; i <= text.length - target.length; i++) {
        let substring = text.substring(i, i + maxLength);
        const distance = levenshteinDistance(target, substring);
        matches.push({ substring, distance });
    }

    // Sort matches by distance
    matches.sort((a, b) => a.distance - b.distance);

    // Return top N closest matches
    return matches.slice(0, topN);
}

function findMatchByAccession_json(data, accession, exactSearchType) {//主函数
    switch (exactSearchType) {
        case "protein ID":
            var ret = [data.find(i => {
                return (
                    i['UniProtKB ID'] === accession ||
                    i['Protein Name'] === accession ||
                    (i['RefSeq'] && i['RefSeq'].includes(accession)) ||
                    (i['UniProtKB Accession'] && i['UniProtKB Accession'].includes(accession)) ||
                    (i['GenPept'] && i['GenPept'].includes(accession))
                );
            })];
            if (ret)
                ret["highlights"] = accession
            return ret;
            break;

        case "Gene Name":
            var ret = [data.find(i => i['Gene Name'].includes(accession))];
            if (ret)
                ret["highlights"] = accession
            return ret;
            break;

        case "Protein Sequence":
            var topN = 5;

            var tmp_data = data.map(item => {
                return {
                    seq: item.seq
                };
            });
            var options1 = {
                keys: [
                    'seq'
                ],
                threshold: 0.4
            }
            var fuse1 = new Fuse(tmp_data, options1)
            var res_fuse = fuse1.search(accession)
            console.log(res_fuse);
            // var matches = findSequence(data.map(i => i['seq']), accession, topN);
            var matches = findSequence(res_fuse, accession, topN);
            var result = [];
            for (var i of matches) {
                var match = data[i.idx];//i里面有idx=refindex，i.idx就对应的是data的index
                match["highlights"] = i.substring;//fuse里的内容 对应的是搜索了什么内容
                result.push(match);
            }
            return result;
            // return matches.map(i => data[i.idx]); // 返回所有匹配的元素
            break;

        default:
            console.log("No match found");
    }
}

function displayMatches(match, exactSearchType) {
    if (exactSearchType === "Protein Sequence") {
        // 针对"Protein Sequence"的处理逻辑
        if (match && match.length > 0) {
            var container = document.getElementById('myTableContainer');
            container.innerHTML = ''; // 清空表格内容
            //概率显示表清空
            document.getElementById("probabilityTable").style.display = 'none';

            // 创建一个表格
            const table = document.createElement('table');
            table.style.border = '1px solid black'; // 添加边框
            table.style.borderCollapse = 'collapse'; // 合并边框
            table.style.width = '100%'; // 表格宽度为100%
            table.style.tableLayout = 'fixed'; // 固定表格布局，确保列宽均匀

            // 表头部分只生成一次
            const headers = ['UniProtKB ID', 'UniProtKB Accession', 'Gene Name', 'GenPept'];
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                th.style.border = '1px solid black'; // 为表头添加边框
                th.style.padding = '8px'; // 增加一些内边距
                th.style.textAlign = 'left'; // 左对齐
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow); // 添加表头到表格

            // 生成表格数据行
            match.forEach((item, index) => {
                const values = [
                    item['UniProtKB ID'],
                    item['UniProtKB Accession'],
                    item['Gene Name'],
                    item['GenPept']
                ];

                const dataRow = document.createElement('tr'); // 创建数据行
                // 根据index设置行背景颜色
                dataRow.style.backgroundColor = (index % 2 === 0) ? '#D0E6C4' : '';

                values.forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    td.style.border = '1px solid black'; // 添加边框
                    td.style.padding = '8px'; // 增加内边距
                    td.style.wordBreak = 'break-word'; // 自动换行
                    td.style.textAlign = 'left'; // 左对齐

                    // 为每个值添加点击事件，点击后将匹配的完整数据填充到表格
                    td.addEventListener('click', function () {
                        // 显示概率表格
                        document.getElementById("probabilityTable").style.display = '';

                        // 获取概率值并更新
                        var procell = document.getElementById("probabilityValue");
                        procell.textContent = match[0].Probability;

                        // 生成完整的表格并更新容器
                        const htmlTable = generateHtmlTable_json(item);
                        document.getElementById('myTableContainer').innerHTML = htmlTable;


                        // 删除横线
                        document.querySelector('.boxTable').remove()

                        // 高亮显示 sequence 部分
                        const sequenceContainer = document.getElementById('myTableContainer');
                        const inputSequence = item.highlights; // 获取输入的序列
                        const sequence = sequenceContainer.innerHTML; // 当前 sequence 内容

                        // 使用 addHighlighting 函数对序列部分高亮处理
                        const highlightedSequence = addHighlighting(sequence, inputSequence);

                        // 更新表格中的 sequence 部分内容，显示高亮后的结果
                        sequenceContainer.innerHTML = highlightedSequence;
                    });

                    dataRow.appendChild(td); // 将单元格添加到数据行
                });

                table.appendChild(dataRow); // 将数据行添加到表格
            });

            container.appendChild(table); // 将表格添加到容器中
        } else {
            document.getElementById('searchContent').textContent = 'No information found for the given accession.';
            document.getElementById("probabilityValue").textContent = "no result";
        }
    } else if (exactSearchType === "protein ID" || exactSearchType === "Gene Name") {
        // 针对"protein ID"和"Gene Name"的处理逻辑
        if (match && match.length > 0 && match[0]) {
            var procell = document.getElementById("probabilityValue");
            procell.textContent = match[0].Probability;

            // 清空表格
            document.getElementById('myTableContainer').innerHTML = '';
            //概率
            var procell = document.getElementById("probabilityValue");
            procell.textContent = match[0].Probability;
            // 遍历匹配到的数组，生成并追加表格
            match.forEach((item) => {
                const htmlTable = generateHtmlTable_json(item);
                document.getElementById('myTableContainer').innerHTML += htmlTable;
            });
        } else {
            document.getElementById('searchContent').textContent = 'No information found for the given accession.';
            document.getElementById("probabilityValue").textContent = "no result";
        }
    }
}

function findMatchByAccession(data, accession) {
    // 使用~~~~作为分隔符将数据分割成一个列表
    var sections = data.split('~~~');

    // 遍历列表，寻找包含指定accession的元素
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].includes(accession)) {
            // 如果找到匹配的段落，返回该段落
            return sections[i];
        }
    }
}

function generateHtmlTable_json(match) {
    let htmlContent = '<table id="res_table" class="boxTable" width="100%" border="1" bgcolor="#ffffff" cellpadding="8" cellspacing="0">';
    let formattedSequence = ''; // 初始化格式化后的序列字符串
    for (const [key, value] of Object.entries(match)) {
        if (key === "highlights") {
            continue;
        }
        if (key === 'Probability') {

        }
        else if (key != 'seq') {
            htmlContent += `
                            <tr>
                                <td class="ID" width="20%">${key}</td>
                                <td class="content wrap" width="80%">${value}</td>
                            </tr>
                        `;
        }
    }
    htmlContent += `
            <tr class="custom-row">
                <td class="ID" width="20%">Sequence</td>
                <td>`;
    htmlContent += match['seq'].replaceAll('\n', '<br>');
    htmlContent += `</td></tr></table>`;
    return htmlContent;
}

function addHighlighting(sequence, inputSequence) {
    // 先去除输入的 inputSequence 中的空格和换行符
    const formattedInput = inputSequence.replace(/\s+/g, '');

    // 构造一个正则表达式，允许 sequence 中的匹配部分包含任意数量的空格
    const regex = new RegExp(formattedInput.split('').map(char => `${char}\\s*`).join(''), 'gi');

    console.log("regex: ", regex);

    // 替换匹配的部分，同时保持原始文本的空格
    return sequence.replace(regex, (match) => {
        // 保留原始空格，但用 span 标签包裹匹配的部分
        return `<span class="highlighted">${match}</span>`;
    });
}

function generateHtmlTable(match) {
    // 使用正则表达式按行分割文本，同时匹配冒号及其前面的空格
    const rows = match.split('\n');
    let htmlContent = '<table class="boxTable" width="100%" border="1" bgcolor="#ffffff" cellpadding="8" cellspacing="0">';
    let sequenceList = []; // 初始化序列列表
    let formattedSequence = ''; // 初始化格式化后的序列字符串

    // 遍历每一行，创建HTML表格行
    for (const row of rows) {
        if (!row.startsWith('Sequence:')) {
            // 使用正则表达式匹配每一行的ID和Content
            const match = row.match(/(.+?):(.+)/);
            if (match) {
                // 捕获组1是ID，捕获组2是Content
                const id = match[1].trim();
                const content = match[2].trim();
                htmlContent += `
                            <tr>
                                <td class="ID" width="20%">${id}</td>
                                <td class="content wrap" width="80%">${content}</td>
                            </tr>
                        `;
            }
        }
    }
    htmlContent += `
            <tr class="custom-row">
                <td class="ID" width="20%">Sequence</td>
                <td>`;
    for (const row of rows) {
        if (row.startsWith('Sequence:')) {
            const sequenceText = row.replace('Sequence: ', '');
            const sequenceLink = `<a >${sequenceText}</a>`;
            sequenceList.push(sequenceLink); // 将序列行添加到列表中
        }
    }



    // 生成包含序列信息的表格行，并将格式化后的序列信息放置在一个<td>标签中
    htmlContent += sequenceList.join('<br>') + `</td></tr>`;

    // 结束HTML表格
    htmlContent += '</table>';

    // 返回完整的HTML表格字符串
    return htmlContent;
}

const levenshteinDistance = (function () {
    function _min(d0, d1, d2, bx, ay) {
        return d0 < d1 || d2 < d1
            ? d0 > d2
                ? d2 + 1
                : d0 + 1
            : bx === ay
                ? d1
                : d1 + 1;
    }

    return function (a, b) {
        if (a === b) {
            return 0;
        }

        if (a.length > b.length) {
            var tmp = a;
            a = b;
            b = tmp;
        }

        var la = a.length;
        var lb = b.length;

        while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
            la--;
            lb--;
        }

        var offset = 0;

        while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
            offset++;
        }

        la -= offset;
        lb -= offset;

        if (la === 0 || lb < 3) {
            return lb;
        }

        var x = 0;
        var y;
        var d0;
        var d1;
        var d2;
        var d3;
        var dd;
        var dy;
        var ay;
        var bx0;
        var bx1;
        var bx2;
        var bx3;

        var vector = [];

        for (y = 0; y < la; y++) {
            vector.push(y + 1);
            vector.push(a.charCodeAt(offset + y));
        }

        var len = vector.length - 1;

        for (; x < lb - 3;) {
            bx0 = b.charCodeAt(offset + (d0 = x));
            bx1 = b.charCodeAt(offset + (d1 = x + 1));
            bx2 = b.charCodeAt(offset + (d2 = x + 2));
            bx3 = b.charCodeAt(offset + (d3 = x + 3));
            dd = (x += 4);
            for (y = 0; y < len; y += 2) {
                dy = vector[y];
                ay = vector[y + 1];
                d0 = _min(dy, d0, d1, bx0, ay);
                d1 = _min(d0, d1, d2, bx1, ay);
                d2 = _min(d1, d2, d3, bx2, ay);
                dd = _min(d2, d3, dd, bx3, ay);
                vector[y] = dd;
                d3 = d2;
                d2 = d1;
                d1 = d0;
                d0 = dy;
            }
        }

        for (; x < lb;) {
            bx0 = b.charCodeAt(offset + (d0 = x));
            dd = ++x;
            for (y = 0; y < len; y += 2) {
                dy = vector[y];
                vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
                d0 = dy;
            }
        }

        return dd;
    };
})();