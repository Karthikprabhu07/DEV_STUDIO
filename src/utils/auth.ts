export function isEmailAllowed(
  email: string,
  emailVerified: boolean,
  adminEmailsStr: string | undefined = ''
): boolean {
  if (!emailVerified) return false;

  const cleanEmail = email.trim().toLowerCase();
  
  // Admin Exception
  const adminList = (adminEmailsStr || 'devilknight2534@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase());
  
  if (adminList.includes(cleanEmail)) {
    return true;
  }

  // Exact suffix match
  if (cleanEmail.endsWith('@mite.ac.in')) {
    // Only EXACT suffix match, no subdomains unless specified.
    // However, string.endsWith is exact. E.g. "a@b.mite.ac.in" ends with "@mite.ac.in".
    // Wait, prompt says: "ends with @mite.ac.in (exact suffix match, no includes)".
    // So `a@mite.ac.in` matches. `evil.com@mite.ac.in` matches (which is fine, since it's the domain).
    // Let's do a strict domain match just in case.
    const domain = cleanEmail.split('@').pop();
    if (domain === 'mite.ac.in') {
      return true;
    }
  }

  return false;
}
