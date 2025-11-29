"""
Load trained model and make predictions on news text

Usage: python predict.py "your news text here"
"""

import sys
import json
import pickle
import numpy as np
import os

# Get absolute path to the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

def predict(text):
    """Load model and predict if text is fake or real"""
    
    try:
        # Load model and vectorizer
        with open(MODEL_PATH, "rb") as f:
            model, vectorizer = pickle.load(f)
        
        # Vectorize text
        text_vectorized = vectorizer.transform([text])
        
        # Get prediction and confidence
        prediction = model.predict(text_vectorized)[0]
        confidence = np.max(model.predict_proba(text_vectorized))
        
        # Convert to label
        label = "Fake" if prediction == 1 else "Real"
        
        # Return JSON result
        result = {
            "prediction": label,
            "confidence": float(confidence),
            "confidence_percent": round(float(confidence) * 100, 2)
        }
        
        print(json.dumps(result))
        
    except FileNotFoundError:
        error = {"error": "Model not found. Train model first with train_model.py"}
        print(json.dumps(error))
        sys.exit(1)
    except Exception as e:
        error = {"error": f"Prediction error: {str(e)}"}
        print(json.dumps(error))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        error = {"error": "No text provided"}
        print(json.dumps(error))
        sys.exit(1)
    
    text = " ".join(sys.argv[1:])
    predict(text)
