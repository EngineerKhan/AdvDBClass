import pandas as pd
import random
import os
import numpy as np
import time

# Read Excel file into DataFrame
df = pd.read_csv('secA.csv')

# Use current time as random seed (changes every run)
np.random.seed(int(time.time()) % 100000)

# Randomly assign grades (A–E) completely at random
grades = ['A', 'B', 'C', 'D', 'E']
df["assignedExam"] = np.random.choice(grades, size=len(df))

# Optionally save to a new file
output_path = os.path.join("assignedMidsAsec.csv")
df.to_csv(output_path, index=False)

print(f"File saved to: {output_path}")