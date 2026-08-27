CREATE TABLE IF NOT EXISTS installation_license(
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  token text NOT NULL CHECK(length(token) BETWEEN 40 AND 20000),
  installed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  installed_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON installation_license FROM PUBLIC;
