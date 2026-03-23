import pandas as pd
import numpy as np
import string
import re
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
import pickle

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'[%s]' % re.escape(string.punctuation), '', text)
    text = re.sub(r'\w*\d\w*', '', text)
    text = re.sub(r'[‘’“”…]', '', text)
    text = re.sub(r'\n', '', text)
    return text

nlp = spacy.load("en_core_web_sm")
def lemmatize_text(text):
    doc = nlp(text)
    return " ".join([token.lemma_ for token in doc if not token.is_punct and not token.is_stop])

def preprocess(text):
    text = str(text)
    return lemmatize_text(clean_text(text))

def main():
    print("Loading dataset...")
    df = pd.read_csv('e:\\capstone project\\Clinical-Text-Analysis-main\\mtsamples.csv')
    
    # Filter and clean categories based on notebook
    print("Processing categories...")
    df['medical_specialty'] = df['medical_specialty'].astype(str).str.strip()
    
    mask_exclude = df['medical_specialty'].isin([
        'Surgery', 'SOAP / Chart / Progress Notes', 'Office Notes', 
        'Consult - History and Phy.', 'Emergency Room Reports', 
        'Discharge Summary', 'Pain Management', 'General Medicine'
    ])
    df = df[~mask_exclude]
    
    df.loc[df['medical_specialty'] == 'Neurosurgery', 'medical_specialty'] = 'Neurology'
    df.loc[df['medical_specialty'] == 'Nephrology', 'medical_specialty'] = 'Urology'
    
    data = df[['transcription', 'medical_specialty']].dropna()
    print("Preprocessing text...")
    data['transcription'] = data['transcription'].apply(preprocess)
    
    X = data['transcription']
    y = data['medical_specialty']
    
    print("Building pipeline...")
    # Setup pipeline with TF-IDF and Logistic Regression
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(analyzer='word', stop_words='english', ngram_range=(1,3), 
                                  max_df=0.75, min_df=5, use_idf=True, smooth_idf=True, 
                                  sublinear_tf=True, max_features=1000)),
        ('clf', LogisticRegression(penalty='elasticnet', solver='saga', l1_ratio=0.5, random_state=1, max_iter=100))
    ])
    
    print("Training model...")
    pipeline.fit(X, y)
    
    print("Saving model to model.pkl...")
    with open('model.pkl', 'wb') as f:
        pickle.dump(pipeline, f)
    
    print("Model training complete and saved.")

if __name__ == '__main__':
    main()
