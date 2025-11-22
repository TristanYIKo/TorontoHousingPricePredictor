# Toronto Housing Price Predictor

A machine learning project that forecasts Toronto’s Housing Price Index (HPI) using historical housing, economic, and financial data.

Live Demo: https://toronto-housing-price-predictor.vercel.app/

## Overview

This project trains a set of XGBoost regression models to predict the Toronto HPI at multiple future time horizons (1, 2, 3, 6 months and 1, 2, 3 years). The goal is to understand how economic indicators relate to housing prices and generate forward-looking predictions.

## 📂 Dataset Download

Because the raw datasets are extremely large (several CSVs up to ~4 million rows), they are stored externally.

**Google Drive Folder:**  
https://drive.google.com/drive/folders/1WqDOycTn5odsZhpGzrtqLKqYMBKp3hQA?usp=sharing  

## Data Sources

The dataset is built from several public sources:

- **Statistics Canada** — six large CSV files (some up to ~4M rows) containing housing, CPI, unemployment, incomes, building permits, and other macroeconomic data  
- **Bank of Canada Valet API** — interest rates, treasury bill rates, and bond yields  

All data was converted into monthly numeric fields for modeling.

## Data Processing

Data preparation was done in Python using pandas:

- Cleaned and parsed raw CSV files  
- Removed unused fields and ensured all columns were numeric  
- Merged datasets into a single monthly table  
- Created future HPI targets by shifting values for each prediction horizon  
- Produced a clean, analysis-ready dataset for model training  

## Model Training

The machine learning workflow includes:

- Training **seven XGBoost regression models**, one for each prediction horizon  
- Using structured monthly features as inputs  
- Evaluating each model using MAE, RMSE, and R²  
- Exporting predictions and metrics for further analysis  

This project demonstrates an end-to-end data workflow: **collecting data → cleaning and preparing it → engineering features → training predictive models** focused on the Toronto housing market.
