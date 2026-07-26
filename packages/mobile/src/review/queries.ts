/**
 * The review queue's reads. One query shape, two filters (open / resolved).
 *
 * The LEFT JOINs are what let the queue name a record: a live row is on the
 * device, so its own values are used; a deleted one is not (bucket-filter,
 * D-046), so the joins come back null and `flagSubject` falls back to the flag's
 * payload. That is why the payload exists.
 */

export const REVIEW_SELECT = `
  SELECT
    f.*,
    c.make      AS car_make,
    c.model     AS car_model,
    c.nickname  AS car_nickname,
    r.reading_km     AS reading_km,
    r.recorded_date  AS reading_date
  FROM flags f
  LEFT JOIN cars c
    ON c.id = CASE WHEN f.record_table = 'cars' THEN f.record_id ELSE f.car_id END
  LEFT JOIN odometer_readings r
    ON f.record_table = 'odometer_readings' AND r.id = f.record_id
`;

export const OPEN_REVIEW_SQL = `${REVIEW_SELECT} WHERE f.resolved_at IS NULL ORDER BY f.created_at DESC, f.id`;
export const RESOLVED_REVIEW_SQL = `${REVIEW_SELECT} WHERE f.resolved_at IS NOT NULL ORDER BY f.resolved_at DESC, f.id`;
export const ONE_REVIEW_SQL = `${REVIEW_SELECT} WHERE f.id = ?`;
