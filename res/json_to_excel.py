import pandas as pd
import json

# 读取 JSON 文件
with open('data.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# 将 JSON 转换为 DataFrame
df = pd.DataFrame(data)

# 将 DataFrame 保存为 Excel 文件
df.to_excel('output.xlsx', index=False)