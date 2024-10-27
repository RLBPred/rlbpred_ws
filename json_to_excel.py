import pandas as pd # type: ignore
import json
from tqdm import tqdm # type: ignore

# 读取 JSON 文件
with open('output1.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# 使用 tqdm 显示处理进度
data_list = []
for item in tqdm(data, desc="Processing JSON Data"):
    data_list.append(item)

# 将列表转换为 DataFrame
df = pd.DataFrame(data_list)

# 将 DataFrame 保存为 Excel 文件
df.to_excel('output.xlsx', index=False)