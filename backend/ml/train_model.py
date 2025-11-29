"""
Train a fake news detection model and save it as model.pkl

Uses scikit-learn with TF-IDF vectorization and Logistic Regression.
Supports training on the Kaggle "Fake and Real News Dataset".
"""

import pandas as pd
import pickle
import sys
import os
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

# Get absolute path to the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

def clean_text(text):
    """Basic text cleaning"""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text) # Remove URLs
    text = re.sub(r'<.*?>', '', text) # Remove HTML
    text = re.sub(r'[^\w\s]', '', text) # Remove punctuation
    return text

def train_model():
    """Train and save the fake news detection model"""
    
    print("--- AI Fake News Model Trainer ---")
    
    try:
        df = None
        
        # Check for Kaggle dataset files (True.csv and Fake.csv)
        true_path = os.path.join(BASE_DIR, "True.csv")
        fake_path = os.path.join(BASE_DIR, "Fake.csv")
        
        if os.path.exists(true_path) and os.path.exists(fake_path):
            print("Found True.csv and Fake.csv! Loading real-world dataset...")
            
            # Load and label data
            df_true = pd.read_csv(true_path)
            df_true["label"] = 0 # Real
            
            df_fake = pd.read_csv(fake_path)
            df_fake["label"] = 1 # Fake
            
            # Combine and shuffle
            df = pd.concat([df_true, df_fake], axis=0).sample(frac=1).reset_index(drop=True)
            
            # Use title and text for better context
            df["text"] = df["title"] + " " + df["text"]
            
            print(f"Loaded {len(df)} articles.")
            
        else:
            print("Real dataset not found (True.csv/Fake.csv).")
            print("Using small synthetic dataset for demonstration...")
            # Create synthetic data for demonstration
            data = {
                "text": [
                    "Scientists discover new species of deep sea fish in the Pacific Ocean.",
                    "Aliens confirmed by government in secret leaked document!",
                    "Study shows drinking water is good for health.",
                    "You won't believe this one weird trick to lose weight instantly!",
                    "NASA launches new rover to Mars to search for signs of life.",
                    "Shocking report reveals the moon is actually made of cheese.",
                    "Local election results announced with record voter turnout.",
                    "Doctors hate him! Cure for all diseases found in backyard weed.",
                    "Tech company releases new smartphone with advanced camera features.",
                    "Government admits to controlling weather with secret machine.",
                    "Global economy shows signs of recovery after recession.",
                    "Celebrity secretly admits to being a lizard person in interview.",
                    "New research links exercise to improved mental health.",
                    "5G towers are spreading mind control viruses, claims expert.",
                    "Education department announces new curriculum standards.",
                    "Secret society runs the world from underground bunker.",
                    "Astronomers detect radio signals from distant galaxy.",
                    "Miracle pill cures aging and makes you immortal!",
                    "Stock market closes higher after positive jobs report.",
                    "The earth is flat and NASA is hiding the ice wall."
                ],
                "label": [
                    0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 
                    0, 1, 0, 1, 0, 1, 0, 1, 0, 1
                ] # 0 = Real, 1 = Fake
            }
            df = pd.DataFrame(data)
        
        # Prepare data
        print("Cleaning and preparing data...")
        df["text"] = df["text"].apply(clean_text)
        
        # Split data
        print("Splitting data (80% train, 20% test)...")
        X_train, X_test, y_train, y_test = train_test_split(
            df["text"], 
            df["label"], 
            test_size=0.2, 
            random_state=42
        )
        
        # Vectorize text
        print("Vectorizing text (TF-IDF)...")
        # Increased features for real dataset
        vectorizer = TfidfVectorizer(
            max_features=10000, 
            stop_words="english",
            max_df=0.9,
            min_df=2,
            ngram_range=(1, 2) # Use bigrams for better context (e.g. "fake news")
        )
        X_train_vectorized = vectorizer.fit_transform(X_train)
        X_test_vectorized = vectorizer.transform(X_test)
        
        # Train model
        print("Training Logistic Regression model...")
        model = LogisticRegression(max_iter=500, random_state=42)
        model.fit(X_train_vectorized, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test_vectorized)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\nModel Performance:")
        print(f"  Accuracy:  {accuracy:.4f}")
        
        # Save model and vectorizer
        print(f"\nSaving model to {MODEL_PATH}...")
        with open(MODEL_PATH, "wb") as f:
            pickle.dump((model, vectorizer), f)
        
        print("Model saved successfully")
        return True
        
    except Exception as e:
        print(f"Error training model: {e}")
        return False

if __name__ == "__main__":
    success = train_model()
    sys.exit(0 if success else 1)
