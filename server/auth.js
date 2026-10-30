import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { fail } from './store.js';

const cookie='teras_session';
const ttl=8*60*60*1000;
export function createAuth(store, mode) {
  const sessions=new Map();
  const demoUsers=[
    {id:'demo-owner',email:'owner@tamanteras.local',name:'Owner Taman Teras',role:'owner',password:process.env.DEMO_OWNER_PASSWORD||'TerasOwner2026!'},
    {id:'demo-cashier',email:'kasir@tamanteras.local',name:'Kasir Taman Teras',role:'cashier',password:process.env.DEMO_CASHIER_PASSWORD||'TerasKasir2026!'},
  ].map(({password,...user})=>({...user,hash:scryptSync(password,'taman-teras-demo',64)}));
  const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api'};
  const digest=value=>createHash('sha256').update(value).digest('hex');
  return {
    async login(req,res) {
      const {email,password}=req.body;
      let user,accessToken,expires=ttl;
      if(mode==='demo') {
        const found=demoUsers.find(x=>x.email===email.toLowerCase());
        const hash=scryptSync(password,'taman-teras-demo',64);
        if(!found||!timingSafeEqual(found.hash,hash)) fail('Email atau kata sandi salah.',401);
        const {hash:_,...profile}=found; user=profile;
      } else {
        const client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
        const {data,error}=await client.auth.signInWithPassword({email,password});
        if(error) fail('Email atau kata sandi salah.',401);
        const result=await store.db.from('staff_profiles').select('id,name,role,active').eq('id',data.user.id).single();
        if(result.error || !result.data?.active) fail('Akun tidak memiliki akses staf.',403);
        user={...result.data,email:data.user.email}; accessToken=data.session.access_token; expires=data.session.expires_in*1000;
      }
      for(const [key,session] of sessions) if(session.expiresAt<Date.now()) sessions.delete(key);
      const token=randomBytes(32).toString('hex');
      sessions.set(digest(token),{user,accessToken,expiresAt:Date.now()+expires});
      res.cookie(cookie,token,{...options,maxAge:expires});
      return user;
    },
    async require(req,res,next) {
      try {
        const token=req.cookies[cookie];
        const session=token&&sessions.get(digest(token));
        if(!session || session.expiresAt<Date.now()) fail('Sesi berakhir. Silakan masuk kembali.',401);
        if(mode==='supabase') {
          const {data,error}=await store.db.auth.getUser(session.accessToken);
          if(error||!data.user) fail('Sesi berakhir. Silakan masuk kembali.',401);
          const profile=await store.db.from('staff_profiles').select('id,name,role,active').eq('id',data.user.id).single();
          if(profile.error||!profile.data?.active) fail('Akses staf dinonaktifkan.',403);
          req.user={...profile.data,email:data.user.email};
        } else req.user=session.user;
        next();
      } catch(error) {next(error);}
    },
    owner(req,res,next) {if(req.user?.role!=='owner') return next(Object.assign(new Error('Halaman ini hanya dapat diakses owner.'),{status:403})); next();},
    logout(req,res) { const token=req.cookies[cookie]; if(token) sessions.delete(digest(token)); res.clearCookie(cookie,options); },
  };
}
