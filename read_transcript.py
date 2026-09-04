import json

with open('/home/admin/.gemini/antigravity-ide/brain/8320f2c3-8348-405a-860e-26e970b77b84/.system_generated/logs/transcript.jsonl','r') as f:
    lines = f.readlines()

for line in lines[-100:]:
    try:
        d = json.loads(line.strip())
        t = d.get('type','')
        si = d.get('step_index','?')
        if t == 'USER_INPUT':
            c = d.get('content','')[:600]
            print(f'[step {si}] USER: {c}')
            print('---')
        elif t == 'PLANNER_RESPONSE' and d.get('content'):
            c = d.get('content','')[:200]
            print(f'[step {si}] MODEL_RESP: {c}')
            print('---')
        elif t == 'PLANNER_RESPONSE':
            tc = d.get('tool_calls',[])
            tools = [x.get('name','') for x in tc] if tc else []
            print(f'[step {si}] MODEL_TOOLS: {tools}')
    except:
        pass
