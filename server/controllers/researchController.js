import { investmentGraph } from "../graph/investmentGraph.js";

export const analyzeCompany = async(req,res)=>{

    try{

        const { company } = req.body;

        const result = await investmentGraph.invoke({

            company

        });

        res.json({

            success:true,

            result

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:err.message

        })

    }

}