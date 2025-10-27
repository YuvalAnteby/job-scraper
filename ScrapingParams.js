
// keywords
export const query = '("Junior Software Developer" OR "Junior Software Engineer" OR "Junior Full Stack" OR "Junior Full-Stack")';

// must have words - might behave weirdly
export const exactTerms = '';

// exclude these words
export const excludeTerms = [
    // exclude senior-ish roles
    'Senior', 'Manager', 'Architect', 'Principal', 'Mid', 'Midlevel', 'Director', 'Head', 'Experienced',
    // exclude unwanted roles that might sneak in
    'SOC', 'NOC'
].join(' ');

// dX will search the last X days results
export const DATE_RESTRICT = 'd3';

// sites to search in
export const JOB_SITES = [
   // 'drushim.co.il',
   // 'alljobs.co.il',
    'il.linkedin.com/jobs',
];

export const MAX_PAGES = 3;