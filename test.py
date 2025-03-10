from openai import OpenAI
client = OpenAI(api_key="sk-25171d1029b641938e890963e751bff4", base_url="https://api.deepseek.com")

# Round 1

# Round 1
messages = [{"role": "user", "content": "9.11 and 9.8, which is greater?"}]
response = client.chat.completions.create(
    model="deepseek-reasoner",
    messages=messages
)

reasoning_content = response.choices[0].message.reasoning_content
content = response.choices[0].message.content

print(reasoning_content)
print(content)
# ...
