import pandas as pd

# Load your dataset
df = pd.read_csv(r'src\voice\Indian Cities Database.csv')

# Clean the 'State' column
df['State'] = df['State'].str.strip().str.lower()

# Overwrite the original CSV file with the cleaned data
df.to_csv(r'src\voice\Indian Cities Database.csv', index=False)
