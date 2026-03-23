from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import os
import string
import re
import spacy

app = FastAPI(title="NLP Medical Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'[%s]' % re.escape(string.punctuation), '', text)
    text = re.sub(r'\w*\d\w*', '', text)
    text = re.sub(r'[‘’“”…]', '', text)
    text = re.sub(r'\n', '', text)
    return text

print("Loading spacy model...")
nlp = spacy.load("en_core_web_sm")
print("Spacy model loaded.")

def lemmatize_text(text):
    doc = nlp(text)
    return " ".join([token.lemma_ for token in doc if not token.is_punct and not token.is_stop])

def preprocess(text):
    text = str(text)
    return lemmatize_text(clean_text(text))

model = None
model_path = os.getenv('MODEL_PATH', os.path.join(os.path.dirname(__file__), '..', 'model.pkl'))
print(f"Loading ML model from {model_path}...")
try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    print("ML model loaded successfully.")
except Exception as e:
    print(f"Error loading ML model: {e}")

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    summary: str
    prediction: str

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Model is not loaded")
    
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        processed_text = preprocess(request.text)
        prediction = model.predict([processed_text])[0]
        
        # Returns the predicted medical specialty
        result = f"Predicted Specialty: {prediction}"
        
        return PredictResponse(summary=result, prediction=prediction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
