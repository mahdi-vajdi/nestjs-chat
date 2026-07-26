const fs = require('fs');
const path = require('path');

function findFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, files);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = findFiles(process.cwd());

files.forEach(file => {
  // skip node_modules and dist
  if (file.includes('node_modules') || file.includes('dist')) return;

  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. TSConfig & App Module paths updates (and generic imports)
  content = content.replace(/"src\/application\/user\/\*"/g, '"src/modules/user/*"');
  content = content.replace(/"src\/application\/auth\/\*"/g, '"src/modules/auth/*"');
  content = content.replace(/"src\/chat\/\*"/g, '"src/modules/chat/*"');

  // 2. Chat module path (we moved chat into modules)
  content = content.replace(/'@chat\/chat.module'/g, `'@chat/chat.module'`); // no change in token, but we should make sure app.module is updated if needed. Wait, tsconfig alias `@chat/*` handles it.
  
  // Update internal imports inside auth module
  content = content.replace(/@auth\/models\//g, '@auth/domain/models/');
  content = content.replace(/@auth\/types\//g, '@auth/domain/types/');
  content = content.replace(/@auth\/services\//g, '@auth/application/services/');
  content = content.replace(/@auth\/database\/providers\/auth-database\.provider/g, '@auth/application/ports/auth-repository.port');
  content = content.replace(/@auth\/database\/postgres\/entities\//g, '@auth/infrastructure/postgres/entities/');
  content = content.replace(/@auth\/database\/postgres\/services\/auth-postgres\.service/g, '@auth/infrastructure/postgres/repositories/auth-postgres.repository');
  content = content.replace(/@auth\/database\/auth-database\.module/g, '@auth/infrastructure/postgres/auth-database.module');
  content = content.replace(/@auth\/configs\//g, '@auth/infrastructure/configs/');
  
  // Auth Class Names
  content = content.replace(/AUTH_DATABASE_PROVIDER/g, 'AUTH_REPOSITORY_PORT');
  content = content.replace(/AuthDatabaseProvider/g, 'AuthRepositoryPort');
  content = content.replace(/AuthPostgresService/g, 'AuthPostgresRepository');

  // Update internal imports inside user module
  content = content.replace(/@user\/models\//g, '@user/domain/models/');
  content = content.replace(/@user\/enums\//g, '@user/domain/enums/');
  content = content.replace(/@user\/services\//g, '@user/application/services/');
  content = content.replace(/@user\/database\/providers\/user-database\.provider/g, '@user/application/ports/user-repository.port');
  content = content.replace(/@user\/database\/options\//g, '@user/application/ports/options/');
  content = content.replace(/@user\/database\/postgres\/entities\//g, '@user/infrastructure/postgres/entities/');
  content = content.replace(/@user\/database\/postgres\/services\/user-postgres\.service/g, '@user/infrastructure/postgres/repositories/user-postgres.repository');
  content = content.replace(/@user\/database\/user-database\.module/g, '@user/infrastructure/postgres/user-database.module');
  
  // User Class Names
  content = content.replace(/USER_DATABASE_PROVIDER/g, 'USER_REPOSITORY_PORT');
  content = content.replace(/UserDatabaseProvider/g, 'UserRepositoryPort');
  content = content.replace(/UserPostgresService/g, 'UserPostgresRepository');

  // Controllers/Presentation imports (from presentation/http to modules/*/presentation)
  // E.g. @presentation/http/controllers/auth -> @auth/presentation/http
  content = content.replace(/@presentation\/http\/controllers\/auth\//g, '@auth/presentation/http/');
  content = content.replace(/@presentation\/http\/controllers\/user\//g, '@user/presentation/http/');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
