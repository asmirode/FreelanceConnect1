import React, { useReducer, useState, useEffect } from "react";
import './add.scss';
import { INITIAL_STATE, gigReducer } from "../../reducers/gigReducers";
import upload from '../../utils/upload.js';
import { useQueryClient,useMutation } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import { useNavigate } from "react-router-dom";
const Add = () => {
    const [singleFile, setsingleFile] = useState(undefined);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [domains, setDomains] = useState([]);
    const [loadingDomains, setLoadingDomains] = useState(true);
    const [state, dispatch] = useReducer(gigReducer, INITIAL_STATE);

    // Fetch domains from skills collection
    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const response = await newRequest.get("/skills");
                if (response.data && Array.isArray(response.data)) {
                    const domainList = response.data.map(skill => skill.domain);
                    setDomains(domainList);
                }
            } catch (error) {
                console.error("Error fetching domains:", error);
            } finally {
                setLoadingDomains(false);
            }
        };
        fetchDomains();
    }, []);

    const handlechange = (e) => {
        dispatch({
            type: "CHANGE_INPUT", payload: {
                name: e.target.name === "domain" ? "cat" : e.target.name, 
                value: e.target.value
            }
        })
    }
    const handlefeature = (e) => {
        e.preventDefault();
        dispatch({
            type: "ADD_FEATURE", payload: e.target[0].value,
        });
        e.target.value = ''
    }
    const handleupload = async () => {
        setUploading(true);
        try {
            const cover = await upload(singleFile);

            const images = await Promise.all(
                [...files].map(async file => {
                    const url = await upload(file);
                    return url;
                })
            );
            setUploading(false);
            dispatch({
                type: "ADD_IMAGES", payload: {
                    cover, images
                }
            })
        } catch (error) {
            console.log(error);
        }
    };
    const navigate=useNavigate();
    const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (gig) => {
      return newRequest.post("/gigs", gig);
    },
    onSuccess:()=>{
      queryClient.invalidateQueries(["myGigs"])
    }
  });
    const handlesubmit=(e)=>{
        e.preventDefault();
        
        // Validate all required fields
        if (!state.title.trim()) {
            alert('Title is required');
            return;
        }
        if (!state.domain) {
            alert('Domain is required');
            return;
        }
        if (!state.desc.trim()) {
            alert('Description is required');
            return;
        }
        if (!state.sortTitle.trim()) {
            alert('Service Title is required');
            return;
        }
        if (!state.sortDesc.trim()) {
            alert('Short Description is required');
            return;
        }
        if (!state.deliveryTime || state.deliveryTime < 2) {
            alert('Delivery Time is required and must be at least 2 days');
            return;
        }
        if (!state.revisonNumber || state.revisonNumber < 1) {
            alert('Revision Number is required and must be at least 1');
            return;
        }
        if (!state.price || state.price <= 0) {
            alert('Price is required and must be greater than 0');
            return;
        }
        if (!state.cover) {
            alert('Cover image is required');
            return;
        }
        
        mutation.mutate(state);
        navigate('/mygigs')
    }
    return ([
        <div className="add">
            <div className="container">
                <h1>Add New Gig</h1>
                <div className="sections">
                    <div className="left">
                        <label htmlFor="">Title <span style={{color: 'red'}}>*</span></label>
                        <input type="text"
                            name="title"
                            id=""
                            placeholder="e.g. I will do something I'm really good at"
                            onChange={handlechange}
                            required
                        />
                        <label htmlFor="">Domain <span style={{color: 'red'}}>*</span></label>
                        <select name="domain" id="domain" onChange={handlechange} disabled={loadingDomains} required>
                            <option value="">Select a domain</option>
                            {domains.map((domain, index) => (
                                <option key={index} value={domain}>{domain}</option>
                            ))}
                        </select>
                        <div className="images">
                            <div className="imagesInputs">
                                <label htmlFor="">Cover Image</label>
                                <input type="file" name="" id="" onChange={e => setsingleFile(e.target.files[0])} />
                                <label htmlFor="">Upload Images</label>
                                <input type="file" name="" id="" multiple onChange={e => setFiles(e.target.files)} />
                            </div>
                        </div>
                        <button onClick={handleupload}>{uploading ? "uploading" : "Upload"}</button>
                        <label htmlFor="">Description <span style={{color: 'red'}}>*</span></label>
                        <textarea
                            name="desc"
                            id=""
                            cols="30"
                            rows="16"
                            placeholder="A brief description to introduce your service to cusmoters"
                            onChange={handlechange}
                            required
                        ></textarea>
                        <button onClick={handlesubmit}>Create</button>
                    </div>
                    <div className="right">
                        <label htmlFor="">Service Title <span style={{color: 'red'}}>*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. One-page web design"
                            name="sortTitle"
                            onChange={handlechange}
                            required
                        />
                        <label htmlFor="">Short Description <span style={{color: 'red'}}>*</span></label>
                        <textarea
                            name="sortDesc"
                            onChange={handlechange}
                            id=""
                            placeholder="Short description of your service"
                            cols="30"
                            rows="10"
                            required
                        ></textarea>
                        <label htmlFor="">Delivery Time (e.g. 3 days) <span style={{color: 'red'}}>*</span></label>
                        <input 
                        type="number" 
                        name="deliveryTime" 
                        min={2} 
                        onChange={handlechange}
                        required
                        />
                        <label htmlFor="">Revision Number <span style={{color: 'red'}}>*</span></label>
                        <input 
                        type="number" 
                        min={1} 
                        name="revisonNumber" 
                        onChange={handlechange}
                        required
                        />
                        <label htmlFor="">Add Features</label>
                        <form action="" className="add" onSubmit={handlefeature}>
                            <input 
                            type="text" 
                            placeholder="e.g. page design" 
                            />
                            <button type="submit">add </button>
                        </form>
                        <div className="addedFeatures">
                            {state?.features?.map(f => (
                                <div className="item" key={f}>
                                    <button onClick={() => dispatch(
                                        {
                                            type: "REMOVE_FEATURE", payload: f
                                        })
                                    }>{f}
                                        <span>X</span>
                                    </button>
                                </div>))}
                        </div>
                        <label htmlFor="">Price <span style={{color: 'red'}}>*</span></label>
                        <input 
                        type="number" 
                        onChange={handlechange}
                        name="price"
                        required
                        />
                    </div>
                </div>
            </div>
        </div>
    ]);
}
export default Add;