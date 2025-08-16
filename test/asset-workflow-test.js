import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
};

let authToken = null;
let userId = null;
let uploadedAssetId = null;

// Helper function to create a test image file
function createTestImage() {
    const testImagePath = path.join(process.cwd(), 'test', 'test-image.jpg');
    
    // Create a simple test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
        // Create a minimal JPEG file for testing
        const minimalJpeg = Buffer.from([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
            0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF,
            0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00,
            0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xD9
        ]);
        
        fs.writeFileSync(testImagePath, minimalJpeg);
        console.log('�� Created test image file');
    }
    
    return testImagePath;
}

// Helper function to wait for a specified time
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: User Registration
async function testUserRegistration() {
    console.log('\n1️⃣ Testing User Registration...');
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
        
        if (response.status === 201) {
            console.log('✅ User registration successful');
            userId = response.data.user._id;
            return true;
        } else {
            console.log('❌ User registration failed:', response.status);
            return false;
        }
    } catch (error) {
        if (error.response && error.response.status === 409) {
            console.log('ℹ️  User already exists, proceeding with login...');
            return await testUserLogin();
        } else {
            console.error('❌ User registration error:', error.response?.data || error.message);
            return false;
        }
    }
}

// Test 2: User Login
async function testUserLogin() {
    console.log('\n2️⃣ Testing User Login...');
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        
        if (response.status === 200) {
            console.log('✅ User login successful');
            authToken = response.data.accessToken;
            userId = response.data.user._id;
            return true;
        } else {
            console.log('❌ User login failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ User login error:', error.response?.data || error.message);
        return false;
    }
}

// Test 3: File Upload (Asset Creation)
async function testFileUpload() {
    console.log('\n3️⃣ Testing File Upload...');
    
    if (!authToken) {
        console.log('❌ No auth token available for file upload');
        return false;
    }
    
    try {
        const testImagePath = createTestImage();
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath));
        formData.append('owner_id', userId);
        formData.append('description', 'Test image for asset workflow testing');
        formData.append('tags', 'test,image,workflow');
        
        const response = await axios.post(`${BASE_URL}/asset`, formData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...formData.getHeaders()
            }
        });
        
        if (response.status === 201) {
            console.log('✅ File upload successful');
            uploadedAssetId = response.data.asset._id;
            console.log('📁 Asset ID:', uploadedAssetId);
            console.log('📁 Asset Title:', response.data.asset.title);
            console.log('�� Asset File Path:', response.data.asset.file_path);
            return true;
        } else {
            console.log('❌ File upload failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ File upload error:', error.response?.data || error.message);
        return false;
    }
}

// Test 4: Asset Retrieval (Single Asset)
async function testAssetRetrieval() {
    console.log('\n4️⃣ Testing Asset Retrieval (Single Asset)...');
    
    if (!authToken || !uploadedAssetId) {
        console.log('❌ No auth token or asset ID available for retrieval test');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/asset/${userId}/${uploadedAssetId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 200) {
            console.log('✅ Asset retrieval successful');
            const asset = response.data;
            console.log('📁 Retrieved Asset Details:');
            console.log('   - ID:', asset._id);
            console.log('   - Title:', asset.title);
            console.log('   - Description:', asset.description);
            console.log('   - File Type:', asset.file_type);
            console.log('   - File Path:', asset.file_path);
            console.log('   - Thumbnail URL:', asset.thumbnail_url || 'Not generated yet');
            console.log('   - Tags:', asset.tags);
            console.log('   - Status:', asset.status);
            console.log('   - Created At:', asset.created_at);
            return true;
        } else {
            console.log('❌ Asset retrieval failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Asset retrieval error:', error.response?.data || error.message);
        return false;
    }
}

// Test 5: Asset Listing (User's Assets)
async function testAssetListing() {
    console.log('\n5️⃣ Testing Asset Listing (User\'s Assets)...');
    
    if (!authToken || !userId) {
        console.log('❌ No auth token or user ID available for listing test');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/asset/${userId}?page=1&limit=10`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 200) {
            console.log('✅ Asset listing successful');
            const data = response.data;
            console.log('�� Asset List Details:');
            console.log('   - Total Assets:', data.pagination.totalCount);
            console.log('   - Current Page:', data.pagination.page);
            console.log('   - Total Pages:', data.pagination.totalPages);
            console.log('   - Assets in Current Page:', data.assets.length);
            
            if (data.assets.length > 0) {
                console.log('   - First Asset Title:', data.assets[0].title);
                console.log('   - First Asset ID:', data.assets[0]._id);
            }
            return true;
        } else {
            console.log('❌ Asset listing failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Asset listing error:', error.response?.data || error.message);
        return false;
    }
}

// Test 6: Wait for Thumbnail Generation
async function testThumbnailGeneration() {
    console.log('\n6️⃣ Testing Thumbnail Generation...');
    
    if (!authToken || !uploadedAssetId) {
        console.log('❌ No auth token or asset ID available for thumbnail test');
        return false;
    }
    
    console.log('⏳ Waiting for thumbnail generation (this may take a few seconds)...');
    
    // Wait for thumbnail generation
    for (let i = 0; i < 10; i++) {
        await wait(2000); // Wait 2 seconds between checks
        
        try {
            const response = await axios.get(`${BASE_URL}/asset/${userId}/${uploadedAssetId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.status === 200) {
                const asset = response.data;
                if (asset.thumbnail_url) {
                    console.log('✅ Thumbnail generated successfully!');
                    console.log('   - Thumbnail URL:', asset.thumbnail_url);
                    console.log('   - Generated At:', asset.thumbnail_generated_at);
                    return true;
                } else if (asset.thumbnail_generation_failed) {
                    console.log('❌ Thumbnail generation failed');
                    console.log('   - Error:', asset.thumbnail_error);
                    return false;
                }
            }
        } catch (error) {
            console.log('⚠️  Error checking thumbnail status:', error.message);
        }
        
        console.log(`⏳ Still waiting... (${i + 1}/10)`);
    }
    
    console.log('⚠️  Thumbnail generation timeout - check if thumbnail service is running');
    return false;
}

// Test 7: Thumbnail Service Health Check
async function testThumbnailServiceHealth() {
    console.log('\n7️⃣ Testing Thumbnail Service Health...');
    
    if (!authToken) {
        console.log('❌ No auth token available for health check');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/thumbnail/health`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 200) {
            console.log('✅ Thumbnail service health check successful');
            const health = response.data;
            console.log('🏥 Service Status:', health.status);
            console.log('📊 Queue Status:', health.queue);
            console.log('🔧 Worker Status:', health.worker);
            return true;
        } else {
            console.log('❌ Thumbnail service health check failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Thumbnail service health check error:', error.response?.data || error.message);
        return false;
    }
}

// Test 8: Cleanup (Delete Test Asset)
async function testCleanup() {
    console.log('\n8️⃣ Testing Asset Cleanup...');
    
    if (!authToken || !uploadedAssetId) {
        console.log('❌ No auth token or asset ID available for cleanup test');
        return false;
    }
    
    try {
        const response = await axios.delete(`${BASE_URL}/asset/${userId}/${uploadedAssetId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 200) {
            console.log('✅ Asset cleanup successful');
            console.log('   - Asset marked as deleted');
            return true;
        } else {
            console.log('❌ Asset cleanup failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Asset cleanup error:', error.response?.data || error.message);
        return false;
    }
}

// Main test function
async function runAssetWorkflowTest() {
    console.log('🚀 Starting Asset Management Workflow Test...\n');
    console.log('�� Test Configuration:');
    console.log('   - Base URL:', BASE_URL);
    console.log('   - Test User:', TEST_USER.email);
    console.log('   - Test File: test-image.jpg\n');
    
    const results = [];
    
    try {
        // Run all tests
        results.push(await testUserRegistration());
        results.push(await testUserLogin());
        results.push(await testFileUpload());
        results.push(await testAssetRetrieval());
        results.push(await testAssetListing());
        results.push(await testThumbnailGeneration());
        results.push(await testThumbnailServiceHealth());
        results.push(await testCleanup());
        
        // Summary
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        const passed = results.filter(r => r === true).length;
        const total = results.length;
        
        console.log(`✅ Passed: ${passed}/${total}`);
        console.log(`❌ Failed: ${total - passed}/${total}`);
        
        if (passed === total) {
            console.log('\n🎉 All tests passed! Asset management workflow is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the error messages above.');
        }
        
    } catch (error) {
        console.error('\n💥 Test execution error:', error.message);
    }
    
    console.log('\n🏁 Asset Management Workflow Test completed.');
}

// // Run the test if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//     runAssetWorkflowTest().catch(console.error);
// }

// export { runAssetWorkflowTest }; 

runAssetWorkflowTest();