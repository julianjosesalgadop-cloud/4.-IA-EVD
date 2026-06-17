const fs = require('fs');
const file = 'src/app/(dashboard)/administracion/usuarios/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const loadDataFunc = `  function openEdit(user: UserProfile) {
    setModalUser(user);
    setShowModal(true);
  }`;

const resetPasswordFunc = `  function openEdit(user: UserProfile) {
    setModalUser(user);
    setShowModal(true);
  }

  const handleResetPassword = async (user: UserProfile) => {
    if (confirm(\`¿Seguro que deseas restablecer la contraseña de \${user.first_name} a Sugamuxi2026*?\`)) {
      try {
        const result = await resetUserPassword(user.id, "Sugamuxi2026*");
        if (result.error) throw new Error(result.error);
        toast.success("Contraseña restablecida a Sugamuxi2026*");
      } catch (error: any) {
        toast.error(error.message || "Error restableciendo contraseña");
      }
    }
  };`;

content = content.replace(loadDataFunc, resetPasswordFunc);

fs.writeFileSync(file, content);
console.log("Patch applied!");