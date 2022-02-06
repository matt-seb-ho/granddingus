from transformers import AutoModelForCausalLM, AutoTokenizer
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

import os
import requests
import torch
import uvicorn


app = FastAPI()
tokenizer = AutoTokenizer.from_pretrained(
    "microsoft/DialoGPT-medium")  # ./phoebe
model = AutoModelForCausalLM.from_pretrained(
    "microsoft/DialoGPT-medium")  # ./phoebe
chat_history_ids = None
msg_count = 0

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    message: str


@app.get("/api")
async def token():
    return requests.post('https://api.assemblyai.com/v2/realtime/token',
                         headers={"authorization": os.environ.get('API_KEY')},
                         json={"expires_in": 3600}).json()


def generate_response(tokenizer, model, chat_round, chat_history_ids, msg):
    new_input_ids = tokenizer.encode(
        msg + tokenizer.eos_token, return_tensors='pt')
    bot_input_ids = torch.cat(
        [chat_history_ids, new_input_ids], dim=-1) if chat_round > 0 else new_input_ids
    chat_history_ids = model.generate(
        bot_input_ids, max_length=1250, pad_token_id=tokenizer.eos_token_id)
    out = (tokenizer.decode(
        chat_history_ids[:, bot_input_ids.shape[-1]:][0], skip_special_tokens=True))
    return chat_history_ids, out


@app.post("/api/message")
async def get_reply(msg_in: Message):
    global msg_count, chat_history_ids, tokenizer, model
    chat_history_ids, out = generate_response(
        tokenizer, model, msg_count, chat_history_ids, msg_in.dict()['message'])
    msg_count += 1
    return {'reply': out}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=80, reload=True)
