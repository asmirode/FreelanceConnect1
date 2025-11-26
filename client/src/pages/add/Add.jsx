import React, { useReducer, useState, useEffect } from "react";
import './add.scss';
import { INITIAL_STATE, gigReducer } from "../../reducers/gigReducers";
import upload from '../../utils/upload.js';
import { useQueryClient,useMutation } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import { useNavigate } from "react-router-dom";
const Add = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    // Check if user is logged in and is a seller
    useEffect(() => {
        if (!currentUser) {
            alert("Please log in to create a gig");
            navigate("/login");
        } else if (!currentUser.isSeller) {
            alert("Only sellers can create gigs. Please update your profile to become a seller.");
            navigate("/");
        }
    }, [currentUser, navigate]);

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
    const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (gig) => {
      return newRequest.post("/gigs", gig);
    },
    onSuccess:()=>{
      queryClient.invalidateQueries(["myGigs"]);
      navigate('/mygigs');
    },
    onError: (error) => {
      alert('Error creating gig: ' + (error.response?.data?.message || error.message));
    }
  });
    const handlesubmit=(e)=>{
        e.preventDefault();
        
        // Validate all required fields
        if (!state.title.trim()) {
            alert('Title is required');
            return;
        }
        if (!state.cat) {
            alert('Domain is required');
            return;
        }
        if (!state.desc.trim()) {
            alert('Description is required');
            return;
        }
        if (!state.sortDesc.trim()) {
            alert('Caption is required');
            return;
        }
        if (!state.deliveryTime || state.deliveryTime < 2) {
            alert('Delivery Time is required and must be at least 2 days');
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
                            placeholder="e.g. Logo Design, Website Development"
                            onChange={handlechange}
                            required
                        />
                        <label htmlFor="">Domain <span style={{color: 'red'}}>*</span></label>
                        <select name="domain" id="domain" onChange={handlechange} disabled={loadingDomains} required>
                            <option value="">Select a Domain</option>
                            {domains.map((domain, index) => (
                                <option key={index} value={domain}>{domain}</option>
                            ))}
                        </select>
                        <label htmlFor="">Caption <span style={{color: 'red'}}>*</span></label>
                        <textarea
                            name="sortDesc"
                            onChange={(e) => {
                                if (e.target.value.length <= 100) {
                                    handlechange(e);
                                }
                            }}
                            id=""
                            placeholder="e.g. I will do something I'm really good at..."
                            cols="30"
                            rows="5"
                            maxLength="100"
                            required
                        ></textarea>
                        <p style={{fontSize: '12px', color: '#999'}}>{state?.sortDesc?.length || 0}/100</p>
                        <div className="images">
                            <div className="imagesInputs">
                                <label htmlFor="">Cover Image <span style={{color: 'red'}}>*</span></label>
                                <input type="file" name="" id="" onChange={e => setsingleFile(e.target.files[0])} required />
                                <label htmlFor="">Upload Images</label>
                                <input type="file" name="" id="" multiple onChange={e => setFiles(e.target.files)} />
                            </div>
                        </div>
                        <button onClick={handleupload} style={{width: 'fit-content', padding: '10px 20px', fontSize: '14px'}}>{uploading ? "uploading" : "Upload"}</button>
                    </div>
                    <div className="right">
                        <label htmlFor="">Description <span style={{color: 'red'}}>*</span></label>
                        <textarea
                            name="desc"
                            id=""
                            cols="30"
                            rows="8"
                            placeholder="A brief description to introduce your service to customers"
                            onChange={(e) => {
                                if (e.target.value.length <= 500) {
                                    handlechange(e);
                                }
                            }}
                            maxLength="500"
                            required
                        ></textarea>
                        <p style={{fontSize: '12px', color: '#999'}}>{state?.desc?.length || 0}/500</p>
                        <label htmlFor="">Delivery Time (e.g. 3 days) <span style={{color: 'red'}}>*</span></label>
                        <input 
                        type="number" 
                        name="deliveryTime" 
                        min={2} 
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
                        <label htmlFor="">Price (INR) <span style={{color: 'red'}}>*</span></label>
                        <input 
                        type="number" 
                        onChange={handlechange}
                        name="price"
                        required
                        />
                    </div>
                </div>
                <button onClick={handlesubmit} style={{display: 'block', margin: '40px auto', padding: '15px 50px', backgroundColor: '#1dbf73', color: 'white', border: 'none', fontSize: '18px', fontWeight: '500', cursor: 'pointer', borderRadius: '4px'}}>Create</button>
            </div>
        </div>
    ]);
}
export default Add;