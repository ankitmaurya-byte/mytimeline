export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

import { NextRequest } from 'next/server';
import { withCORS } from '../../../_lib/cors';
import { ensureDb } from '../../../_lib/db';
import { getDbUserFromRequest } from '../../../_lib/auth';
import { createWorkspaceSchema } from '../../../../../src/validation/workspace.validation';
import { createWorkspaceService } from '../../../../../src/services/workspace.service';
import { HTTPSTATUS } from '../../../../../src/config/http.config';

export const POST = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
    const authUser = await getDbUserFromRequest(req);
    if (!authUser) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });
    
    const body = createWorkspaceSchema.parse(await req.json());
    const { workspace } = await createWorkspaceService(String((authUser as any)._id), body);
    return new Response(JSON.stringify({ message: 'Workspace created successfully', workspace }), { status: HTTPSTATUS.CREATED });
  } catch (error: any) {
    console.error('[workspace/create/new] Error creating workspace:', error);
    
    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({ 
        message: 'Invalid workspace data', 
        errors: error.errors 
      }), { status: HTTPSTATUS.BAD_REQUEST });
    }
    
    if (error.statusCode) {
      return new Response(JSON.stringify({ 
        message: error.message 
      }), { status: error.statusCode });
    }
    
    return new Response(JSON.stringify({ 
      message: 'Failed to create workspace' 
    }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});
