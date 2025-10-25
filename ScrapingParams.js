
// keywords
export const query = '("Software Developer" OR "Software Engineer")';

// must have words
export const exactTerms = 'junior';

// exclude senior-ish roles
export const excludeTerms = [
    'Senior', 'Lead', 'Experienced', 'Manager', 'Architect', 'Principal', 'Mid', 'Mid-level', 'Midlevel',
    'Mid - Senior', 'Team Lead', 'Director', 'Head', 'Tech Lead'
];

// dX will search the last X days results
export const DATE_RESTRICT = 'd3';

// sites to search in
export const JOB_SITES = [
    'drushim.co.il',
    'alljobs.co.il',
    'linkedin.com/jobs',
];