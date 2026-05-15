"""CSV ingestion for X17 calibration spectra.

Each spectrum file has two numeric columns: channel (ADC bin) and counts.
The lab uses inconsistent headers across detectors, so we accept aliases:
    channel | adc       → channel
    counts  | n         → counts
"""

import pandas as pd

REQUIRED_COLUMNS = ("channel", "counts")
COLUMN_ALIASES = {
    "channel": ("channel", "adc"),
    "counts": ("counts", "n"),
}


def parse_csv(file_obj) -> pd.DataFrame:
    """Read a CSV file-like into a normalized (channel, counts) DataFrame.

    Raises ValueError on any unrecoverable problem (empty, unreadable, missing
    columns, non-numeric values).
    """
    try:
        df = pd.read_csv(file_obj)
    except pd.errors.EmptyDataError as e:
        raise ValueError("CSV file is empty") from e
    except pd.errors.ParserError as e:
        raise ValueError(f"Could not parse CSV: {e}") from e

    df = _resolve_aliases(df)
    validate_columns(df)
    return df[list(REQUIRED_COLUMNS)].reset_index(drop=True)


def validate_columns(df: pd.DataFrame) -> None:
    """Check that the DataFrame has channel + counts columns with numeric dtypes.

    Assumes aliases have already been resolved.
    """
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            raise ValueError(
                f"missing required column '{col}' "
                f"(accepted aliases: {COLUMN_ALIASES[col]})"
            )
        if not pd.api.types.is_numeric_dtype(df[col]):
            raise ValueError(f"column '{col}' must be numeric")


def _resolve_aliases(df: pd.DataFrame) -> pd.DataFrame:
    """Rename any alias column to its canonical name. Case-insensitive."""
    lower_to_actual = {c.lower(): c for c in df.columns}
    rename = {}
    for canonical, accepted in COLUMN_ALIASES.items():
        for alias in accepted:
            if alias in lower_to_actual and lower_to_actual[alias] != canonical:
                rename[lower_to_actual[alias]] = canonical
                break
    return df.rename(columns=rename) if rename else df
