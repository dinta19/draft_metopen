import 'dotenv/config';
import { createApp } from './app.js';

const port=Number(process.env.PORT)||3001, host=process.env.HOST||'127.0.0.1';
const app=await createApp();
const server=app.listen(port,host,()=>console.log(`Taman Teras API: http://${host}:${port} (${process.env.DATA_MODE||'demo'})`));
server.on('error',error=>{console.error('Server gagal dijalankan:',error.message);process.exitCode=1;});
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(()=>process.exit(0)));
