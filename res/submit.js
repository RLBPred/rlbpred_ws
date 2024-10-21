
function submitForm() {
    // 获取 select 和 input 的值
    var selectValue = document.getElementById('exact_search_type').value;
    var inputValue = document.getElementById('accessionInput').value;

    if (!selectValue || !inputValue) {
        alert("Please enter the keyword!");
        return;
    }

    // 去除输入框中的空格并将其转为大写
    if (selectValue == "Protein Sequence") {
        inputValue = inputValue.replace(/\s+/g, '');
        inputValue = inputValue.toUpperCase();
    }

    if (inputValue.length == 0) {
        alert("Please enter letters only!");
        return;
    }

    // 构建 URL 参数
    var url = 'formatadjusting4.html?exact_search_type=' + encodeURIComponent(selectValue)
        + '&accession=' + encodeURIComponent(inputValue);

    // 跳转到目标页面，并传递参数
    window.location.href = url;
}