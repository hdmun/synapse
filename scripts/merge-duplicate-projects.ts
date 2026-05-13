import { db } from '../src/backend/db';
import { projects, sessions, plans } from '../src/backend/db/schema';
import { eq, inArray } from 'drizzle-orm';
import path from 'path';
import crypto from 'crypto';

function normalizeAndHashPath(projectPath: string): { normalized: string, hash: string } {
  let normalized = path.resolve(projectPath);
  normalized = normalized.replace(/\\/g, '/');
  
  if (process.platform === 'win32' || process.platform === 'darwin') {
    normalized = normalized.toLowerCase();
  }
  
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  return { normalized, hash };
}

async function runMigration() {
  console.log('Starting project consolidation migration...');

  try {
    const allProjects = await db.select().from(projects);
    const projectGroups = new Map<string, typeof allProjects>();

    // Group projects by their normalized path hash
    for (const p of allProjects) {
      const { hash } = normalizeAndHashPath(p.path);
      if (!projectGroups.has(hash)) {
        projectGroups.set(hash, []);
      }
      projectGroups.get(hash)!.push(p);
    }

    let mergedCount = 0;

    await db.transaction(async (tx) => {
      for (const [hash, group] of projectGroups.entries()) {
        if (group.length > 1) {
          console.log(`Found ${group.length} duplicates for normalized hash: ${hash}`);
          
          // Sort by lastUpdated descending to pick the most recently updated as the master template
          group.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
          
          const master = group[0];
          const duplicates = group.slice(1);
          const duplicateIds = duplicates.map(d => d.id);

          console.log(`  Master ID: ${master.id} (Path: ${master.path})`);
          console.log(`  Duplicate IDs to merge: ${duplicateIds.join(', ')}`);

          // 1. Ensure master has the correct normalized hash ID
          const masterId = hash;
          
          if (master.id !== masterId) {
             // We need to create the true master record if it doesn't exist with this exact ID
             // Check if it already exists in the group (unlikely if they all have different IDs, but possible)
             const existingTrueMaster = group.find(p => p.id === masterId);
             
             if (!existingTrueMaster) {
                 await tx.insert(projects).values({
                    ...master,
                    id: masterId,
                 }).onConflictDoUpdate({
                    target: projects.id,
                    set: {
                        lastUpdated: master.lastUpdated,
                        name: master.name,
                        path: master.path
                    }
                 });
             }
          }

          // Gather all old IDs (including the original master if we created a new true master)
          const allOldIds = [...duplicateIds];
          if (master.id !== masterId) {
              allOldIds.push(master.id);
          }

          if (allOldIds.length > 0) {
              // 2. Update foreign keys in sessions
              await tx.update(sessions)
                .set({ projectId: masterId })
                .where(inArray(sessions.projectId, allOldIds));
              
              // 3. Update foreign keys in plans
              await tx.update(plans)
                .set({ projectId: masterId })
                .where(inArray(plans.projectId, allOldIds));

              // 4. Delete the old project records
              await tx.delete(projects)
                .where(inArray(projects.id, allOldIds));
                
              mergedCount += allOldIds.length;
              console.log(`  Successfully merged and deleted ${allOldIds.length} old project records into ${masterId}`);
          }
        } else if (group.length === 1) {
            // Check if the single project needs ID normalization
            const single = group[0];
            if (single.id !== hash) {
                 console.log(`Normalizing ID for single project: ${single.path}`);
                 // Create new record with correct ID
                 await tx.insert(projects).values({
                    ...single,
                    id: hash,
                 }).onConflictDoNothing();
                 
                 // Update FKs
                 await tx.update(sessions)
                    .set({ projectId: hash })
                    .where(eq(sessions.projectId, single.id));
                    
                 await tx.update(plans)
                    .set({ projectId: hash })
                    .where(eq(plans.projectId, single.id));
                    
                 // Delete old
                 await tx.delete(projects)
                    .where(eq(projects.id, single.id));
            }
        }
      }
    });

    console.log(`Migration completed successfully. Merged/Normalized ${mergedCount} project records.`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();