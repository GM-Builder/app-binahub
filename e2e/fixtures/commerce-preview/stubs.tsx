// Synthetic identity only. Cannot authenticate against a BinaHub service.
import React from 'react';
export const supabase={auth:{getSession:async()=>({data:{session:{user:{id:'synthetic-admin'},access_token:'synthetic-only'}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}};
export default function Link({href,children,...rest}:React.ComponentProps<'a'>){return <a href={href} {...rest}>{children}</a>;}
