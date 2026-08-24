-- Create usersettings table for BYOK (Bring Your Own Key) feature
CREATE TABLE IF NOT EXISTS usersettings (
    user_id VARCHAR NOT NULL PRIMARY KEY,
    use_custom_llm BOOLEAN NOT NULL DEFAULT FALSE,
    llm_provider VARCHAR,
    llm_model VARCHAR,
    llm_api_key VARCHAR,
    llm_base_url VARCHAR
);
