export function parseYoutubeId(input?: string | null): string | null {
    if (!input) return null;
    const s = input.trim();

    // If looks like a plain id (11 chars, alphanumeric, - and _), return directly
    const idMatch = s.match(/^[a-zA-Z0-9_-]{11}$/);
    if (idMatch) return idMatch[0];

    // Try common YouTube URL patterns
    // Examples:
    // - https://www.youtube.com/watch?v=XXXX
    // - https://youtu.be/XXXX
    // - https://www.youtube.com/embed/XXXX
    // - https://www.youtube.com/watch?v=XXXX&ab_channel=...
    const patterns = [
        /v=([a-zA-Z0-9_-]{11})/, // watch?v=
        /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/
        /embed\/([a-zA-Z0-9_-]{11})/, // embed/
        /watch\/v\/([a-zA-Z0-9_-]{11})/ // watch/v/
    ];

    for (const re of patterns) {
        const m = s.match(re);
        if (m && m[1]) return m[1];
    }

    // Last attempt: look for 11-char token anywhere
    const any = s.match(/([a-zA-Z0-9_-]{11})/);
    return any ? any[1] : null;
}
