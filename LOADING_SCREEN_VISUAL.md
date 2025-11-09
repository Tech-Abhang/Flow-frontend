# Training Progress - Visual Layout

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                      🔄 Training Models                        │
│        Training 5 ML models on your dataset.                  │
│             This will take 2-5 minutes.                       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                      ⚙️ [Spinning Loader]                      │
│                                                                │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ 🧠 Training Ridge, SVR, Random Forest, Gradient     │   │
│    │    Boosting, and XGBoost models with                │   │
│    │    hyperparameter tuning...                          │   │
│    └──────────────────────────────────────────────────────┘   │
│                                                                │
│    Training Random Forest...                         47%      │
│    ━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░                │
│                                                                │
│    ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                   │
│    │Ridge│  │SVR │  │ RF │  │ GB │  │XGB │                   │
│    └────┘  └────┘  └────┘  └────┘  └────┘                   │
│      ✓       ✓       🔥      ░       ░                        │
│                                                                │
│    ╔══════════════════════════════════════════════════════╗   │
│    ║  🔄 Cross-Validation Progress      Fold 3 / 5       ║   │
│    ╠══════════════════════════════════════════════════════╣   │
│    ║                                                      ║   │
│    ║  CV Folds                                            ║   │
│    ║  ━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░  60%              ║   │
│    ║                                                      ║   │
│    ║  ─────────────────────────────────────────────────  ║   │
│    ║  Current CV Score (R²):                   0.847 ✨  ║   │
│    ║                                                      ║   │
│    ║  ▓▓▓  ▓▓▓  ⚡  ░░░  ░░░                             ║   │
│    ║  done done active pending pending                   ║   │
│    ╚══════════════════════════════════════════════════════╝   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Legend:

### Main Progress:

- **47%**: Overall training progress (0-95% smooth, then 95-100% on completion)
- **━━━**: Completed progress (blue)
- **░░░**: Remaining progress (gray)

### Model Status:

- **✓** (Green): Model training completed
- **🔥** (Highlighted): Currently training this model
- **░** (Gray): Not started yet

### CV Progress Box (appears during model training):

- **Purple/Pink gradient** background
- **Fold 3 / 5**: Shows current fold out of total folds
- **60%**: Percentage of CV folds completed
- **0.847**: Current R² score (improves with each fold)
- **✨**: Animation when score updates

### Fold Indicators (bottom of CV box):

- **▓▓▓** (Green gradient): Completed folds
- **⚡** (Yellow, pulsing): Current fold in progress
- **░░░** (Gray): Pending folds

---

## Animation Behaviors:

1. **Main Spinner**: Continuously rotating
2. **Progress Bar**: Smoothly fills left-to-right
3. **Model Pills**: Change color when active/complete
4. **CV Box**: Fades in when model training starts
5. **CV Progress Bar**: Fills as folds complete
6. **CV Score**: Scales up and flashes green on update
7. **Active Fold**: Pulses yellow to draw attention
8. **Completed Folds**: Turn green with gradient

---

## Timing Example (3-minute training):

```
Time    Progress  Step                          CV Display
─────────────────────────────────────────────────────────────
0:00    0%        Loading dataset...            Hidden
0:18    10%       Preprocessing data...         Hidden
0:36    21%       Training Ridge Regression...  Fold 1/5 → 0.65
0:44    23%                                     Fold 2/5 → 0.71
0:52    26%                                     Fold 3/5 → 0.78
1:00    28%                                     Fold 4/5 → 0.84
1:08    31%                                     Fold 5/5 → 0.89
1:16    34%       Training SVR...               Fold 1/5 → 0.67
1:24    36%                                     Fold 2/5 → 0.73
1:32    39%                                     Fold 3/5 → 0.80
1:40    42%                                     Fold 4/5 → 0.86
1:48    44%                                     Fold 5/5 → 0.91
1:56    47%       Training Random Forest...     Fold 1/5 → 0.69
2:04    50%                                     Fold 2/5 → 0.75
2:12    52%                                     Fold 3/5 → 0.82
2:20    55%                                     Fold 4/5 → 0.88
2:28    57%                                     Fold 5/5 → 0.93
2:36    60%       Training Gradient Boosting... Fold 1/5 → 0.71
2:44    63%                                     Fold 2/5 → 0.77
2:52    65%                                     Fold 3/5 → 0.84
3:00    68%                                     Fold 4/5 → 0.90
3:08    71%                                     Fold 5/5 → 0.95
3:16    73%       Training XGBoost...           Fold 1/5 → 0.73
3:24    76%                                     Fold 2/5 → 0.79
3:32    79%                                     Fold 3/5 → 0.86
3:40    81%                                     Fold 4/5 → 0.92
3:48    84%                                     Fold 5/5 → 0.97
3:56    87%       Evaluating models...          Hidden
4:04    90%       Selecting best model...       Hidden
4:12    93%       Generating analysis...        Hidden
4:20    95%       [Waiting for backend...]      Hidden
???     100%      Training complete! ✓          Hidden
```

---

## Mobile Responsive:

- Stack elements vertically on small screens
- CV box takes full width
- Fold indicators remain horizontal
- Text sizes adjust for readability
