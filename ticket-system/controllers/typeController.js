const pool = require('../config/db');

const getTypes = async (req,res)=>{
  try{
    const [data]=await pool.query('SELECT * FROM types');
    res.json({total:data.length,data});
  }catch(e){res.status(500).json({error:e.message});}
};

const getTypeById = async (req,res)=>{
  try{
    const [[t]]=await pool.query('SELECT * FROM types WHERE id=?',[req.params.id]);
    t?res.json(t):res.status(404).json({error:'No encontrado'});
  }catch(e){res.status(500).json({error:e.message});}
};

const createType = async (req,res)=>{
  const {type,description,area}=req.body;
  if(!type) return res.status(400).json({error:'type requerido'});
  try{
    const [{insertId:id}]=await pool.query(
      'INSERT INTO types (type,description,area) VALUES (?,?,?)',
      [type,description||null,area||null]
    );
    res.status(201).json({id});
  }catch(e){res.status(500).json({error:e.message});}
};

const updateType = async (req,res)=>{
  const {type,description,area}=req.body;
  try{
    const [{affectedRows}]=await pool.query(
      'UPDATE types SET type=COALESCE(?,type),description=COALESCE(?,description),area=COALESCE(?,area) WHERE id=?',
      [type,description,area,req.params.id]
    );
    affectedRows?res.json({message:'Actualizado'}):res.status(404).json({error:'No encontrado'});
  }catch(e){res.status(500).json({error:e.message});}
};

const deleteType = async (req,res)=>{
  try{
    const [{affectedRows}]=await pool.query('DELETE FROM types WHERE id=?',[req.params.id]);
    affectedRows?res.json({message:'Eliminado'}):res.status(404).json({error:'No encontrado'});
  }catch(e){res.status(500).json({error:e.message});}
};

module.exports={getTypes,getTypeById,createType,updateType,deleteType};