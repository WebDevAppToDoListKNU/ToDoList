import axios from 'axios'

const API_KEY = process.env.OPENAPI_KEY
console.log(API_KEY)

const chat = async (prompt, onMessage) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  }
  const messages = [{ role: 'user', content: prompt }]

  console.log("=>", prompt)
  axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      messages: messages
    }, { headers, timeout: 10000 }
  ).then(response => {
    console.log(response.data.choices[0].message.content)
    onMessage(response.data.choices[0].message.content)
  }).catch(err => { console.log(err); onMessage(err.message) })
}

export { chat }