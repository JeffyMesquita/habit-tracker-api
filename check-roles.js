const { PrismaClient } = require('@prisma/client');

async function checkRoles() {
	const prisma = new PrismaClient();

	try {
		const roles = await prisma.role.findMany();
		console.log('🔍 Roles encontrados no banco de dados:');
		console.log(JSON.stringify(roles, null, 2));

		const users = await prisma.user.findMany({
			include: {
				role: true,
			},
		});
		console.log('\n👥 Usuários e seus roles:');
		users.forEach((user) => {
			console.log(`- ${user.email}: ${user.role?.name || 'SEM ROLE'}`);
		});
	} catch (error) {
		console.error('❌ Erro:', error.message);
	} finally {
		await prisma.$disconnect();
	}
}

checkRoles();
