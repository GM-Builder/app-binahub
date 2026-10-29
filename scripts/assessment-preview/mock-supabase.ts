export const supabase = { auth: { getSession: async () => ({ data: { session: new URLSearchParams(location.search).has('rm-review')?{access_token:'synthetic-preview-not-a-credential'}:null } }) } };
