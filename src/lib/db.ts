import { init } from '@instantdb/react';
import schema from '../../instant.schema';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || '2778ee56-afcb-4fd8-b9a9-a648b36b8108';

export const db = init({ 
  appId: APP_ID, 
  schema,
});
