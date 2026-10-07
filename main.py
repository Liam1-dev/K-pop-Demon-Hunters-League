    {"role": "user", "content": args.user_prompt},
]
if api_key == None:
    raise RuntimeError("Api key not found")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)
response = client.chat.completions.create(
    model="openrouter/free",
    messages=messages,
)

if response.usage == None:
    raise RuntimeError("Please try again later no response usage found")
if args.verbose:
    print(f"User prompt: {args.user_prompt}")
    print(f"Prompt tokens: {response.usage.prompt_tokens}")
    print(f"Response tokens: {response.usage.completion_tokens}")
print(response.choices[0].message.content)
def main():
    print("")
if __name__ == "__main__":
    main()
