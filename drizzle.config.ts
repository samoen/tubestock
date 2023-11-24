import type { Config } from "drizzle-kit";
 
export default {
  schema: "./src/lib/server/schema.ts",
  out: "./drizzle",
  
  dbCredentials:{
    host:'localhost',
    database:'tubestock',
    password:'password'
  },
  driver:'pg',

} satisfies Config;