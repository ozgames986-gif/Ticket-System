const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const base = `FROM users u LEFT JOIN careers c ON u.career_id=c.id`;

const createUser = async (req,res)=>{
  const {name,last_name,username,email,career_id,password,rol}=req.body;
  if([name,last_name,username,email,password].some(f=>!f))
    return res.status(400).json({error:'Campos requeridos'});
  try{
    const [dup]=await pool.query('SELECT id FROM users WHERE email=? OR username=?',[email,username]);
    if(dup.length) return res.status(400).json({error:'Duplicado'});
    const hash=await bcrypt.hash(password,10);
    const [{insertId:id}]=await pool.query(
      `INSERT INTO users (name,last_name,username,email,career_id,password,rol) VALUES (?,?,?,?,?,?,?)`,
      [name,last_name,username,email,career_id||null,hash,rol||'user']
    );
    res.status(201).json({id});
  }catch(e){res.status(500).json({error:e.message});}
};

const getUsers = async (req,res)=>{
  let {page=1,limit=10,sort='id',order='ASC'}=req.query;
  const s=['id','name','email','created_at','rol'].includes(sort)?sort:'id';
  const o=['ASC','DESC'].includes(order.toUpperCase())?order.toUpperCase():'ASC';
  const off=(page-1)*limit;
  try{
    const [data]=await pool.query(
      `SELECT u.id,u.name,u.last_name,u.username,u.email,u.rol,u.active,u.failed_attempts,u.created_at,c.name career ${base}
       ORDER BY u.${s} ${o} LIMIT ? OFFSET ?`,
      [+limit,off]
    );
    const [[{total}]]=await pool.query('SELECT COUNT(*) total FROM users');
    res.json({total,page:+page,limit:+limit,data});
  }catch(e){res.status(500).json({error:e.message});}
};

const getUserById = async (req,res)=>{
  try{
    const [[u]]=await pool.query(
      `SELECT u.id,u.name,u.last_name,u.username,u.email,u.rol,u.active,u.career_id,c.name career,u.created_at ${base} WHERE u.id=?`,
      [req.params.id]
    );
    u?res.json(u):res.status(404).json({error:'No encontrado'});
  }catch(e){res.status(500).json({error:e.message});}
};

const filterUsers = async (req,res)=>{
  const {name,email,career,rol}=req.query;
  let q=`SELECT u.id,u.name,u.last_name,u.username,u.email,u.rol,u.active,c.name career ${base} WHERE 1=1`,p=[];
  if(name)   q+=' AND u.name LIKE ?',  p.push(`%${name}%`);
  if(email)  q+=' AND u.email LIKE ?', p.push(`%${email}%`);
  if(career) q+=' AND c.name LIKE ?',  p.push(`%${career}%`);
  if(rol)    q+=' AND u.rol=?',        p.push(rol);
  try{
    const [data]=await pool.query(q,p);
    res.json({total:data.length,data});
  }catch(e){res.status(500).json({error:e.message});}
};

const updateStatus = async (req,res)=>{
  const {active}=req.body;
  if(active===undefined) return res.status(400).json({error:'active requerido'});
  try{
    const [{affectedRows}]=await pool.query('UPDATE users SET active=? WHERE id=?',[active,req.params.id]);
    affectedRows?res.json({active}):res.status(404).json({error:'No encontrado'});
  }catch(e){res.status(500).json({error:e.message});}
};

const updateUser = async (req,res)=>{
  const allowed=['name','last_name','username','email','career_id','rol','password'];
  const f=Object.keys(req.body).filter(k=>allowed.includes(k));
  if(!f.length||f.length>5) return res.status(400).json({error:'Campos inválidos'});
  try{
    const vals=[],sets=[];
    for(const k of f){
      sets.push(`${k}=?`);
      vals.push(k==='password'?await bcrypt.hash(req.body[k],10):req.body[k]);
    }
    vals.push(req.params.id);
    const [{affectedRows}]=await pool.query(`UPDATE users SET ${sets} WHERE id=?`,vals);
    affectedRows?res.json({message:'Actualizado'}):res.status(404).json({error:'No encontrado'});
  }catch(e){res.status(500).json({error:e.message});}
};

const deleteUser = async (req,res)=>{
  const hard=req.query.hard==='true';
  try{
    const [{affectedRows}]=await pool.query(
      hard?'DELETE FROM users WHERE id=?':'UPDATE users SET active=FALSE WHERE id=?',
      [req.params.id]
    );
    affectedRows?res.json({message:hard?'Eliminado':'Desactivado'}):res.status(404).json({error:'No encontrado'});
  }catch(e){res.status(500).json({error:e.message});}
};

module.exports={createUser,getUsers,getUserById,filterUsers,updateStatus,updateUser,deleteUser};