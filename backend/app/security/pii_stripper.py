import spacy
import re
from typing import Tuple, Dict

# Load the english model, requires `python -m spacy download en_core_web_sm`
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback to importing silently if the model isn't downloaded yet. We will make sure to download it in setup.
    nlp = None

def strip_pii(text: str) -> Tuple[str, Dict[str, str]]:
    """
    Strips PII from input text and replaces them with placeholders.
    Returns: (anonymised_text, encrypted_entities_dict)
    """
    if not text:
        return text, {}
        
    extracted_entities = {}
    anonymised_text = text
    
    # --- 1. Regex Replacements (Aadhaar, PAN, Indian Mobile) ---
    
    # Aadhaar (12 digits, optional spaces)
    aadhaar_pattern = r'\b\d{4}\s?\d{4}\s?\d{4}\b'
    for match in re.finditer(aadhaar_pattern, anonymised_text):
        original = match.group()
        extracted_entities['[ID]'] = original # Ideal is to generate unique keys per match, but simplified for now
        anonymised_text = anonymised_text.replace(original, "[ID]")
        
    # PAN Card (5 letters, 4 digits, 1 letter)
    pan_pattern = r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'
    for match in re.finditer(pan_pattern, anonymised_text):
        original = match.group()
        extracted_entities['[ID]'] = original
        anonymised_text = anonymised_text.replace(original, "[ID]")

    # Indian Mobile Number (+91 or not, 10 digits starting with 6-9)
    phone_pattern = r'\b(?:\+91[-.\s]?)?[6789]\d{9}\b'
    for match in re.finditer(phone_pattern, anonymised_text):
        original = match.group()
        extracted_entities['[PHONE]'] = original
        anonymised_text = anonymised_text.replace(original, "[PHONE]")
        
    # Standard email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'
    for match in re.finditer(email_pattern, anonymised_text):
        original = match.group()
        extracted_entities['[EMAIL]'] = original
        anonymised_text = anonymised_text.replace(original, "[EMAIL]")

    # --- 2. spaCy NER Replacements ---
    if nlp is not None:
        doc = nlp(anonymised_text)
        
        # We process matches backwards to not mess up indices during replacement
        # Though .replace() string method is easier for this scale. We'll use string replace for simplicity.
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                extracted_entities['[NAME]'] = ent.text
                anonymised_text = anonymised_text.replace(ent.text, "[NAME]")
            # Phone / Email are often picked up by regex better, but spaCy can catch generics
            
    return anonymised_text, extracted_entities
